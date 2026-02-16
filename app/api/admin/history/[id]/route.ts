import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { deleteHistory, updateHistory } from "@/lib/server/data-store";
import type { TradeHistoryItem } from "@/lib/trades";

function toDisplayDate(dateISO: string) {
  const date = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateISO;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).format(date).replace(/ /g, "-");
}

function sanitizeHistory(input: unknown): Omit<TradeHistoryItem, "id"> | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  const dateISO = String(body.dateISO ?? "").trim();

  const next: Omit<TradeHistoryItem, "id"> = {
    dateISO,
    displayDate: toDisplayDate(dateISO),
    stock: String(body.stock ?? "").trim(),
    side: body.side === "SELL" ? "SELL" : "BUY",
    entry: Number(body.entry ?? 0),
    target: Number(body.target ?? 0),
    stopLoss: Number(body.stopLoss ?? 0),
    high: Number(body.high ?? 0),
    low: Number(body.low ?? 0),
    result: body.result === "STOP LOSS" ? "STOP LOSS" : body.result === "PARTIAL" ? "PARTIAL" : "TARGET HIT",
    returnPct: Number(body.returnPct ?? 0),
    moveReason: typeof body.moveReason === "string" ? body.moveReason.trim() : "",
    technicalAnalysis: typeof body.technicalAnalysis === "string" ? body.technicalAnalysis.trim() : "",
    technicalPoints: Array.isArray(body.technicalPoints) ? body.technicalPoints.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [],
    latestNews: Array.isArray(body.latestNews) ? body.latestNews.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [],
    yearlyMovement: Array.isArray(body.yearlyMovement) ? body.yearlyMovement.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [],
    chartImageUrl: typeof body.chartImageUrl === "string" ? body.chartImageUrl.trim() : "",
  };

  if (!next.stock || !next.dateISO) return null;
  if (!Number.isFinite(next.entry) || !Number.isFinite(next.target) || !Number.isFinite(next.stopLoss)) return null;
  if (!Number.isFinite(next.high) || !Number.isFinite(next.low) || !Number.isFinite(next.returnPct)) return null;
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
  const item = sanitizeHistory(payload);
  if (!item) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const updated = await updateHistory(id, item);
  if (!updated) return NextResponse.json({ error: "History record not found" }, { status: 404 });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await ensureAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const deleted = await deleteHistory(id);
  if (!deleted) return NextResponse.json({ error: "History record not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
