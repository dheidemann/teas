import { NextResponse } from "next/server";
import { exec as execCb } from "child_process";
import { promisify } from "util";

const exec = promisify(execCb);

type Data = { printers: string[]; default?: string } | { error: string };

export const runtime = "nodejs";

export async function GET() {
  try {
    const { stdout } = await exec("lpstat -p");
    const lines = stdout.split("\n");
    const printers: string[] = [];
    for (const l of lines) {
      const m = l.match(/^printer\s+(\S+)/);
      if (m) printers.push(m[1]);
    }

    let defaultPrinter = "";
    try {
      const { stdout: out2 } = await exec("lpstat -d");
      if (out2) {
        const md = out2.match(/system default destination:\s*(\S+)/i);
        if (md) defaultPrinter = md[1];
      }
    } catch (e) {
      // leave defaultPrinter empty if lpstat -d fails
    }

    const ordered = printers.sort((a, b) =>
      a === defaultPrinter ? -1 : b === defaultPrinter ? 1 : 0
    );

    const data: Data = { printers: ordered, default: defaultPrinter };
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to run lpstat: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}
