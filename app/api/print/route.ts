import { NextResponse } from "next/server";
import { exec as execCb } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const exec = promisify(execCb);

export const runtime = "nodejs"; // needed for child_process

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const printer = formData.get("printer") as string | null;
    const duplex = formData.get("duplex") as string | null;
    const color = formData.get("color") as string | null;
    const copies = formData.get("copies") as string | null;
    const format = formData.get("format") as string | null;

    if (!file)
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!printer)
      return NextResponse.json(
        { error: "No printer selected" },
        { status: 400 }
      );

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "print-"));
    const tempFilePath = path.join(tempDir, file.name);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));

    const args: string[] = [];
    args.push("-d", printer);
    if (copies) args.push("-n", copies);
    if (duplex && duplex !== "one-sided") args.push("-o", `sides=${duplex}`);
    if (color)
      args.push(
        "-o",
        color === "grayscale" ? "ColorModel=Gray" : "ColorModel=Color"
      );
    if (format) args.push("-o", "media=", format);
    args.push(tempFilePath);

    const cmd = `lp ${args.map((a) => `"${a}"`).join(" ")}`;

    const { stdout } = await exec(cmd);

    fs.unlinkSync(tempFilePath);
    fs.rmdirSync(tempDir);

    const jobIdMatch = stdout.match(/request id is (\S+)/i);
    const jobId = jobIdMatch ? jobIdMatch[1] : undefined;

    return NextResponse.json({ jobId });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to print: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}
