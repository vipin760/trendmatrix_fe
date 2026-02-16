import { NextRequest, NextResponse } from "next/server";
import { trackTrafficHit } from "@/lib/server/data-store";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const page = typeof payload.page === "string" ? payload.page : "/";
  const traffic = await trackTrafficHit(page);
  return NextResponse.json({ ok: true, traffic });
}
