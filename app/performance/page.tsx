"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchHistory, hitTraffic, type HistoryItem } from "@/lib/client/trading-api";

export default function PerformancePage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchHistory({ page: 1, limit: 200, sort: "-closedAt" })
      .then((res) => setItems(res.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    void hitTraffic("/performance", "GET");
  }, []);

  const metrics = useMemo(() => {
    const total = items.length;
    const wins = items.filter((i) => i.outcome === "win").length;
    const losses = items.filter((i) => i.outcome === "loss").length;
    const breakeven = items.filter((i) => i.outcome === "breakeven").length;
    const totalPnl = items.reduce((sum, i) => sum + Number(i.pnlAmount || 0), 0);
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    return { total, wins, losses, breakeven, totalPnl, winRate };
  }, [items]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 px-4 py-8 text-gray-900 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 dark:text-gray-100">
      <main className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Performance</p>
            <h1 className="text-3xl font-extrabold">Trading Performance Snapshot</h1>
          </div>
          <Link href="/" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700">
            Back To Home
          </Link>
        </div>

        {loading && <p className="text-sm font-semibold">Loading performance...</p>}

        {!loading && (
          <section className="grid gap-4 md:grid-cols-3">
            <Card label="Total Trades" value={String(metrics.total)} />
            <Card label="Win Rate" value={`${metrics.winRate.toFixed(2)}%`} />
            <Card label="Total PnL" value={metrics.totalPnl.toFixed(2)} />
            <Card label="Wins" value={String(metrics.wins)} />
            <Card label="Losses" value={String(metrics.losses)} />
            <Card label="Breakeven" value={String(metrics.breakeven)} />
          </section>
        )}
      </main>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

