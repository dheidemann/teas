import { NextResponse } from "next/server";
import { execFile as execFileCb } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { recordPrintEvent } from "@/lib/recordPrint";
import { headers } from "next/headers";

const EXPORT_METRICS = !!process.env.METRICS_API_KEY
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const CHILD_TIMEOUT_MS = 30_000;
const ALLOWED_DUPLEX = new Set([
  "one-sided",
  "two-sided-long-edge",
  "two-sided-short-edge",
]);
const ALLOWED_COLOR = new Set(["color", "grayscale"]);
const MAX_COPIES = 100;
const PRINTER_NAME_RE = /^[a-zA-Z0-9._-]{1,100}$/;
const FORMAT_RE = /^[a-zA-Z0-9._-]{1,100}$/;
const MAX_PAGES = 30;

const execFile = promisify(execFileCb);
export const runtime = "nodejs";

export async function POST(req: Request) {
  const headersList = await headers();
  const username = headersList.get("Remote-User");

  let tempDir = "";
  let tempFilePath = "";

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const printer = (formData.get("printer") as string | null)?.trim() ?? null;
    const duplex = (formData.get("duplex") as string | null)?.trim() ?? null;
    const color = (formData.get("color") as string | null)?.trim() ?? null;
    const copiesStr = (formData.get("copies") as string | null)?.trim() ?? null;
    const format = (formData.get("format") as string | null)?.trim() ?? null;
    const fitToPage =
      (formData.get("fitToPage") as string | null)?.trim() ?? null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!printer) {
      return NextResponse.json(
        { error: "No printer selected" },
        { status: 400 }
      );
    }

    if (!PRINTER_NAME_RE.test(printer)) {
      return NextResponse.json(
        { error: "Invalid printer name" },
        { status: 400 }
      );
    }

    let copies: number | undefined;
    if (copiesStr) {
      if (!/^\d+$/.test(copiesStr)) {
        return NextResponse.json(
          { error: "Invalid copies value" },
          { status: 400 }
        );
      }
      copies = parseInt(copiesStr, 10);
      if (copies < 1 || copies > MAX_COPIES) {
        return NextResponse.json(
          { error: `Copies must be between 1 and ${MAX_COPIES}` },
          { status: 400 }
        );
      }
    }

    if (duplex && !ALLOWED_DUPLEX.has(duplex)) {
      return NextResponse.json(
        { error: "Unsupported duplex mode" },
        { status: 400 }
      );
    }

    if (color && !ALLOWED_COLOR.has(color)) {
      return NextResponse.json(
        { error: "Unsupported color option" },
        { status: 400 }
      );
    }

    if (format && !FORMAT_RE.test(format)) {
      return NextResponse.json(
        { error: "Invalid format value" },
        { status: 400 }
      );
    }

    const size = (file as any).size ?? undefined;
    if (typeof size === "number" && size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_SIZE_BYTES} bytes)` },
        { status: 413 }
      );
    }

    const mimeType = (file as any).type ?? "";
    const allowedMimes = new Set([
      "application/pdf",
      "application/postscript",
      "text/plain",
      "image/png",
      "image/jpeg",
    ]);
    if (mimeType && !allowedMimes.has(mimeType)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 415 }
      );
    }

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "print-"));
    const safeExt = safeExtFromFilename((file as any).name ?? "");
    const randomName = `${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}${safeExt}`;
    tempFilePath = path.join(tempDir, randomName);

    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    if (buf.length > MAX_FILE_SIZE_BYTES) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_SIZE_BYTES} bytes)` },
        { status: 413 }
      );
    }
    await fs.writeFile(tempFilePath, buf, { mode: 0o600 });

    const pages = await getPdfPages(tempFilePath);
    if (safeExt === ".pdf") {
      if (typeof pages === "number" && pages > MAX_PAGES) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        return NextResponse.json(
          { error: `File has too many pages (max ${MAX_PAGES})` },
          { status: 413 }
        );
      }
    }

    const args: string[] = [];
    args.push("-d", printer);
    if (typeof copies === "number") args.push("-n", String(copies));

    if (duplex && duplex !== "one-sided") {
      args.push("-o", `sides=${duplex}`);
    }

    if (color) {
      args.push(
        "-o",
        color === "grayscale" ? "ColorModel=Gray" : "ColorModel=Color"
      );
    }

    if (format) {
      args.push("-o", `media=${format}`);
    }

    if (fitToPage === "true") {
      args.push("-o", "fit-to-page");
    }

    args.push(tempFilePath);

    let stdout: string;
    try {
      const res = await execFile("lp", args, {
        timeout: CHILD_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
      });
      stdout = (res.stdout ?? "").toString();
    } catch (childErr: any) {
      const stderr = childErr?.stderr
        ? String(childErr.stderr).trim()
        : undefined;
      const detail = stderr ? `: ${stderr}` : "";
      return NextResponse.json(
        { error: `Print command failed${detail}` },
        { status: 500 }
      );
    }

    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    const jobIdMatch =
      stdout.match(/request id is (\S+)/i) ||
      stdout.match(/request id (\S+)/i) ||
      stdout.match(/(\d+) (?:job|request)/i);
    const jobId = jobIdMatch ? jobIdMatch[1] : undefined;

    if (EXPORT_METRICS) {
      recordPrintEvent({
        username: username ?? "",
        pages: (pages ?? 1) * (copies ?? 1),
        success: true,
      });
    }

    console.log(
      `Received print job. Job-ID: ${jobId}, Pages: ${pages ?? 1}, Copies: ${
        copies ?? 1
      }${username ?? `, Username: ${username}`}`
    );

    return NextResponse.json({
      jobId,
      raw: stdout ? stdout.trim() : undefined,
    });
  } catch (err: any) {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }

    if (EXPORT_METRICS) {
      recordPrintEvent({
        username: username ?? "",
        pages: 0,
        success: false,
      });
    }

    const msg = err?.message ?? String(err);
    return NextResponse.json(
      { error: "Failed to print: " + msg },
      { status: 500 }
    );
  }
}

async function getPdfPages(filePath: string): Promise<number | undefined> {
  try {
    const { stdout } = await execFile("pdfinfo", [filePath], {
      timeout: CHILD_TIMEOUT_MS,
    });
    const m = String(stdout).match(/^Pages:\s+(\d+)/im);
    return m ? parseInt(m[1], 10) : undefined;
  } catch {
    return undefined;
  }
}

function safeExtFromFilename(filename: string) {
  const ext = path.extname(filename || "").toLowerCase();
  const allowed = new Set([".pdf", ".ps", ".txt", ".png", ".jpg", ".jpeg"]);
  return allowed.has(ext) ? ext : ".pdf";
}
