"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { fetchPredictionById, hitTraffic, type PredictionItem } from "@/lib/client/trading-api";
import { formatInr } from "@/lib/trades";

function buildPoints(item: PredictionItem) {
  return [
    ...((item.technicalPoints ?? []).filter((point): point is string => typeof point === "string" && point.trim().length > 0).map((point) => point.trim())),
    ...(item.upsideReason ? [`Why up move: ${item.upsideReason}`] : []),
    ...(item.reasoning ? [item.reasoning] : []),
    ...(item.technicalAnalysis ? [item.technicalAnalysis] : []),
  ];
}

export default function IntradayDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<PredictionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    void fetchPredictionById(id)
      .then((res) => setItem(res.item))
      .catch(() => setError("Unable to load prediction details"))
      .finally(() => setLoading(false));

    void hitTraffic(`/intraday/${id}`, "GET");
  }, [id]);

  const points = useMemo(() => (item ? buildPoints(item) : []), [item]);

  if (loading) {
    return <div className="min-h-screen p-8 text-sm font-semibold">Loading details...</div>;
  }

  if (error || !item) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-sm font-semibold text-red-600">{error || "Prediction not found"}</p>
        <Link href="/" className="mt-4 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Back To Home</Link>
      </div>
    );
  }

  const side = item.direction === "long" ? "BUY" : "SELL";
  const target = Number(item.targets?.[0]?.price ?? item.entryPrice);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 text-gray-900 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 dark:text-gray-100">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Intraday Detail</p>
            <h1 className="text-3xl font-extrabold">{item.symbol}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{`${item.market === "stocks" ? "NSE" : item.market.toUpperCase()}: ${item.symbol}`}</p>
          </div>
          <Link href="/" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white">
            Back To Home
          </Link>
        </div>

        <section className="glass mb-6 grid gap-3 rounded-2xl p-5 sm:grid-cols-4">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Signal</p><p className="text-lg font-bold">{side}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Entry</p><p className="text-lg font-bold">{formatInr(Number(item.entryPrice))}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Target</p><p className="text-lg font-bold">{formatInr(target)}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Stop Loss</p><p className="text-lg font-bold">{formatInr(Number(item.stopLoss))}</p></div>
        </section>

        <section className="glass rounded-2xl p-5">
          <h2 className="text-xl font-bold">Technical Analysis Points</h2>
          {points.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {points.map((point) => <li key={point}>- {point}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No analysis points shared.</p>
          )}
        </section>
      </main>
    </div>
  );
}
