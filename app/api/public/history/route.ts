import { NextResponse } from "next/server";
import { readTradingData } from "@/lib/server/data-store";

export async function GET() {
  const data = await readTradingData();
  return NextResponse.json({ items: data.tradeHistory });
}
