"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchPredictions, hitTraffic, type PredictionItem } from "@/lib/client/trading-api";

function isSameDayLocal(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function IntradayPage() {
  const [items, setItems] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPredictions({ page: 1, limit: 50, sort: "-expiresAt", status: "active", market: "stocks" })
      .then((res) => setItems(res.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    void hitTraffic("/intraday", "GET");
  }, []);

  const list = useMemo(() => {
    const today = items.filter((item) => isSameDayLocal(item.expiresAt));
    if (today.length > 0) return today;
    return items;
  }, [items]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 px-4 py-8 text-gray-900 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 dark:text-gray-100">
      <main className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Intraday</p>
            <h1 className="text-3xl font-extrabold">Today&apos;s Active Predictions</h1>
          </div>
          <Link href="/" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700">
            Back To Home
          </Link>
        </div>

        {loading && <p className="text-sm font-semibold">Loading predictions...</p>}
        {!loading && list.length === 0 && <p className="text-sm font-semibold">No predictions available.</p>}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => {
            const target = Number(item.targets?.[0]?.price ?? item.entryPrice);
            const risk = Math.abs(Number(item.entryPrice) - Number(item.stopLoss));
            const reward = Math.abs(target - Number(item.entryPrice));
            const rr = risk > 0 ? `1:${(reward / risk).toFixed(2)}` : "1:0.00";
            return (
              <article key={item._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xl font-bold">{item.symbol}</h2>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold uppercase text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                    {item.direction === "long" ? "BUY" : "SELL"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{`${item.market === "stocks" ? "NSE" : item.market.toUpperCase()}: ${item.symbol}`}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>Entry: INR {Number(item.entryPrice).toFixed(2)}</div>
                  <div>Target: INR {target.toFixed(2)}</div>
                  <div>Stop: INR {Number(item.stopLoss).toFixed(2)}</div>
                  <div>R/R: {rr}</div>
                </div>
                <p className="mt-3 text-sm">{item.upsideReason || item.reasoning || "Technical setup active."}</p>
                <Link href={`/intraday/${item._id}`} className="mt-4 inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500">
                  View Detail
                </Link>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

