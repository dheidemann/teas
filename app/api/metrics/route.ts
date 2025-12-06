import { NextResponse } from "next/server";
import { register } from "@/lib/metrics";

export async function GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      "Content-Type": register.contentType || "text/plain; version=0.0.4",
    },
  });
}
