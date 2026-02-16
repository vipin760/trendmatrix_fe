import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { readTradingData } from "@/lib/server/data-store";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await readTradingData();
  const pageStats = Object.entries(data.traffic.perPage)
    .map(([page, hits]) => ({ page, hits }))
    .sort((a, b) => b.hits - a.hits);

  return NextResponse.json({
    totalHits: data.traffic.totalHits,
    pageStats,
    dailyStats: data.traffic.daily,
    totalPredictions: data.todayCalls.length,
    totalHistoryRecords: data.tradeHistory.length,
    updatedAt: data.traffic.lastUpdated,
  });
}
