import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { createPrediction, readTradingData } from "@/lib/server/data-store";
import type { IntradayCall } from "@/lib/trades";

function sanitizePrediction(input: unknown): Omit<IntradayCall, "id"> | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  const analysisInput = typeof body.analysis === "string" ? body.analysis : "";

  const next: Omit<IntradayCall, "id"> = {
    symbol: String(body.symbol ?? "").trim(),
    exchange: String(body.exchange ?? "").trim(),
    side: body.side === "SELL" ? "SELL" : "BUY",
    confidence: body.confidence === "MEDIUM" ? "MEDIUM" : "HIGH",
    postedAt: String(body.postedAt ?? "").trim(),
    entry: Number(body.entry ?? 0),
    target: Number(body.target ?? 0),
    stopLoss: Number(body.stopLoss ?? 0),
    riskReward: String(body.riskReward ?? "").trim(),
    analysis: analysisInput.split("\n").map((line) => line.trim()).filter(Boolean),
  };

  if (!next.symbol || !next.exchange || !next.postedAt || !next.riskReward) return null;
  if (!Number.isFinite(next.entry) || !Number.isFinite(next.target) || !Number.isFinite(next.stopLoss)) return null;
  return next;
}

async function ensureAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return Boolean(verifySessionToken(token));
}

export async function GET() {
  if (!(await ensureAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await readTradingData();
  return NextResponse.json({ items: data.todayCalls });
}

export async function POST(request: Request) {
  if (!(await ensureAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => ({}));
  const item = sanitizePrediction(payload);
  if (!item) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const created = await createPrediction(item);
  return NextResponse.json({ item: created }, { status: 201 });
}
