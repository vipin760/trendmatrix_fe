"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { fetchHistoryById, fetchHistoryYearlyMovement, hitTraffic, type HistoryItem, type YearlyMovementPayload } from "@/lib/client/trading-api";
import { formatInr, formatPct } from "@/lib/trades";

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildRealGraphUrl(symbol: string, market: string, yahooSymbol?: string) {
  const cleanSymbol = String(symbol || "").trim().toUpperCase();
  const cleanMarket = String(market || "").trim().toLowerCase();
  if (cleanMarket === "stocks") {
    return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(`NSE:${cleanSymbol}`)}`;
  }
  if (cleanMarket === "crypto") {
    return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(`BINANCE:${cleanSymbol}USDT`)}`;
  }
  if (yahooSymbol) {
    return `https://finance.yahoo.com/chart/${encodeURIComponent(yahooSymbol)}`;
  }
  return `https://www.tradingview.com/symbols/${encodeURIComponent(cleanSymbol)}`;
}

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [yearlyData, setYearlyData] = useState<YearlyMovementPayload | null>(null);
  const [yearlyError, setYearlyError] = useState("");

  useEffect(() => {
    if (!id) return;
    void fetchHistoryById(id)
      .then((res) => setItem(res.item))
      .catch(() => setError("Unable to load stock breakdown"))
      .finally(() => setLoading(false));
    void fetchHistoryYearlyMovement(id)
      .then((res) => setYearlyData(res))
      .catch(() => setYearlyError("Unable to load yearly movement data"));

    void hitTraffic(`/history/${id}`, "GET");
  }, [id]);

  const metrics = useMemo(() => {
    if (!item) return null;
    const side = item.direction === "long" ? "BUY" : "SELL";
    const returnPct = typeof item.pnlPercent === "number"
      ? item.pnlPercent
      : item.entryPrice
        ? (((item.exitPrice - item.entryPrice) / item.entryPrice) * 100) * (side === "SELL" ? -1 : 1)
        : 0;
    return { side, returnPct, outcome: item.outcome ?? "-" };
  }, [item]);
  const linkedPrediction =
    item && item.predictionId && typeof item.predictionId === "object" ? item.predictionId : null;
  const realGraphUrl = item
    ? buildRealGraphUrl(item.symbol, item.market, yearlyData?.yahooSymbol)
    : "#";
  const yearlyLoaded = yearlyData !== null || yearlyError.length > 0;
  const chartPoints = useMemo(() => {
    const points = yearlyData?.points ?? [];
    if (points.length < 2) return "";
    const closes = points.map((p) => p.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    return points
      .map((p, idx) => {
        const x = (idx / (points.length - 1)) * 100;
        const y = ((max - p.close) / range) * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [yearlyData]);

  if (loading) {
    return <div className="min-h-screen p-8 text-sm font-semibold">Loading breakdown...</div>;
  }

  if (!id) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-sm font-semibold text-red-600">Invalid history id</p>
        <Link href="/history" className="mt-4 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Back To History</Link>
      </div>
    );
  }

  if (error || !item || !metrics) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-sm font-semibold text-red-600">{error || "Record not found"}</p>
        <Link href="/history" className="mt-4 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Back To History</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 text-gray-900 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 dark:text-gray-100">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trade Record</p>
            <h1 className="text-3xl font-extrabold">{item.symbol}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{`Created: ${formatDateTime(item.createdAt)}`}</p>
          </div>
          <Link href="/history" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white">
            Back To History
          </Link>
        </div>

        <section className="glass mb-6 grid gap-3 rounded-2xl p-5 sm:grid-cols-3">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Market</p><p className="text-lg font-bold">{item.market.toUpperCase()}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Timeframe</p><p className="text-lg font-bold">{item.timeframe}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Side</p><p className="text-lg font-bold">{metrics.side}</p></div>
        </section>

        <section className="glass mb-6 grid gap-3 rounded-2xl p-5 sm:grid-cols-4">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Entry</p><p className="text-lg font-bold">{formatInr(item.entryPrice)}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Exit</p><p className="text-lg font-bold">{formatInr(item.exitPrice)}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Quantity</p><p className="text-lg font-bold">{item.quantity}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Fees</p><p className="text-lg font-bold">{formatInr(item.fees ?? 0)}</p></div>
        </section>

        <section className="glass mb-6 grid gap-3 rounded-2xl p-5 sm:grid-cols-4">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">PnL Amount</p><p className={`text-lg font-bold ${(item.pnlAmount ?? 0) < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{formatInr(item.pnlAmount ?? 0)}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">PnL Percent</p><p className={`text-lg font-bold ${metrics.returnPct < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{formatPct(metrics.returnPct)}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Outcome</p><p className="text-lg font-bold uppercase">{String(metrics.outcome)}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Strategy Tag</p><p className="text-lg font-bold">{item.strategyTag || "-"}</p></div>
        </section>

        <section className="glass mb-6 grid gap-3 rounded-2xl p-5 sm:grid-cols-2">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Opened At</p><p className="text-base font-semibold">{formatDateTime(item.openedAt)}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Closed At</p><p className="text-base font-semibold">{formatDateTime(item.closedAt)}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Created At</p><p className="text-base font-semibold">{formatDateTime(item.createdAt)}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Updated At</p><p className="text-base font-semibold">{formatDateTime(item.updatedAt)}</p></div>
        </section>

        {linkedPrediction && (
          <section className="glass mb-6 rounded-2xl p-5">
            <h2 className="text-xl font-bold">Prediction Data</h2>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><span className="text-gray-500 dark:text-gray-400">Prediction Id</span><p className="font-semibold">{linkedPrediction._id}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Status</span><p className="font-semibold">{linkedPrediction.status || "-"}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Symbol</span><p className="font-semibold">{linkedPrediction.symbol}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Market</span><p className="font-semibold">{linkedPrediction.market}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Timeframe</span><p className="font-semibold">{linkedPrediction.timeframe}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Direction</span><p className="font-semibold">{linkedPrediction.direction}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Confidence</span><p className="font-semibold">{linkedPrediction.confidence}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Risk/Reward</span><p className="font-semibold">{linkedPrediction.riskReward ?? "-"}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Entry Price</span><p className="font-semibold">{formatInr(linkedPrediction.entryPrice)}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Stop Loss</span><p className="font-semibold">{formatInr(linkedPrediction.stopLoss)}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Expires At</span><p className="font-semibold">{formatDateTime(linkedPrediction.expiresAt)}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Created At</span><p className="font-semibold">{formatDateTime(linkedPrediction.createdAt)}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Created By</span><p className="font-semibold">{linkedPrediction.createdBy?.name || "-"}</p></div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Targets</p>
              {linkedPrediction.targets?.length ? (
                <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {linkedPrediction.targets.map((target, index) => (
                    <li key={`${target.price}-${index}`}>{`- Target ${index + 1}: ${formatInr(target.price)}${target.hit ? " (hit)" : ""}`}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">-</p>
              )}
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upside Reason</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{linkedPrediction.upsideReason || "-"}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reasoning</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{linkedPrediction.reasoning || "-"}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Technical Analysis</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{linkedPrediction.technicalAnalysis || "-"}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Technical Points</p>
              {linkedPrediction.technicalPoints?.length ? (
                <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {linkedPrediction.technicalPoints.map((point) => <li key={point}>{`- ${point}`}</li>)}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">-</p>
              )}
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-xl font-bold">Latest News</h2>
            {item.latestNews && item.latestNews.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {item.latestNews.map((news) => <li key={news}>- {news}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No latest news added by admin yet.</p>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <h2 className="text-xl font-bold">Last Year Movement</h2>
            {(yearlyData?.movements?.length ?? 0) > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {yearlyData?.movements.map((move) => <li key={move}>- {move}</li>)}
              </ul>
            ) : item.yearlyMovement && item.yearlyMovement.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {item.yearlyMovement.map((move) => <li key={move}>- {move}</li>)}
              </ul>
            ) : yearlyError ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{yearlyError}</p>
            ) : yearlyLoaded ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No yearly movement data available.</p>
            ) : (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading yearly movement...</p>
            )}
          </div>
        </section>

        <section className="glass mt-6 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Yearly Movement Graph</h2>
            <a
              href={realGraphUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              Open Real Graph
            </a>
          </div>
          {chartPoints ? (
            <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40">
              <svg viewBox="0 0 100 100" className="h-52 w-full">
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="text-emerald-600 dark:text-emerald-400"
                  points={chartPoints}
                />
              </svg>
            </div>
          ) : item.chartImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.chartImageUrl} alt={`${item.symbol} yearly movement graph`} className="mt-3 w-full rounded-xl border border-gray-200 object-cover dark:border-gray-700" />
          ) : yearlyError ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{yearlyError}</p>
          ) : yearlyLoaded ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No yearly graph data available.</p>
          ) : (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading yearly graph...</p>
          )}
        </section>
      </main>
    </div>
  );
}
