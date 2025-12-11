import { NextResponse } from "next/server";
import { register } from "@/lib/metrics";
import { headers } from "next/headers";

const API_KEY = process.env.METRICS_API_KEY;

export async function GET() {
  if (!API_KEY) return new NextResponse("Not Found", { status: 404 });
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new NextResponse("Unauthorized - No Bearer token", { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  if (token !== API_KEY) {
    return new NextResponse("Forbidden - Invalid API Key", { status: 403 });
  }

  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      "Content-Type": register.contentType || "text/plain; version=0.0.4",
    },
  });
}
