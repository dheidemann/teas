import { NextResponse } from "next/server";
import { register } from "@/lib/metrics";

const EXPORT_METRICS = process.env.EXPORT_METRICS === "true";

export async function GET() {
  if (!EXPORT_METRICS) return new NextResponse("Not Found", { status: 404 });

  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      "Content-Type": register.contentType || "text/plain; version=0.0.4",
    },
  });
}
