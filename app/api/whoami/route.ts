import { NextRequest, NextResponse } from "next/server";

/** Visitor's country from Vercel's edge geo header (empty locally). */
export function GET(req: NextRequest) {
  const country = req.headers.get("x-vercel-ip-country") ?? "";
  return NextResponse.json({ country }, { headers: { "Cache-Control": "private, max-age=3600" } });
}
