import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { deletePrediction, updatePrediction } from "@/lib/server/data-store";
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

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  if (!(await ensureAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const item = sanitizePrediction(payload);
  if (!item) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const updated = await updatePrediction(id, item);
  if (!updated) return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await ensureAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const deleted = await deletePrediction(id);
  if (!deleted) return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
