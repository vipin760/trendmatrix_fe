"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { formatInr, formatPct, type TradeHistoryItem, type TradeResult, type TradeSide } from "@/lib/trades";
import { fetchHistory, hitTraffic } from "@/lib/client/trading-api";

function resultPill(result: TradeResult) {
  if (result === "TARGET HIT") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (result === "STOP LOSS") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
}

function formatClosedAt(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());
  return `${day}-${month}-${year}`;
}

export default function HistoryPage() {
  const [stockQuery, setStockQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<"ALL" | TradeResult>("ALL");
  const [sideFilter, setSideFilter] = useState<"ALL" | TradeSide>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downsideOnly, setDownsideOnly] = useState(false);
  const [records, setRecords] = useState<TradeHistoryItem[]>([]);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    void fetchHistory({ page: 1, limit: 50, sort: "-closedAt" })
      .then((payload) =>
        setRecords(
          (payload.items ?? [])
            .map((item) => {
            const prediction = typeof item.predictionId === "object" ? item.predictionId : null;
            const effectiveDateValue = prediction?.expiresAt ?? item.closedAt;
            const date = effectiveDateValue ? new Date(effectiveDateValue) : new Date();
            const displayDate = formatClosedAt(effectiveDateValue);
            const side: TradeSide = item.direction === "long" ? "BUY" : "SELL";
            const pnlPct = item.entryPrice ? ((item.exitPrice - item.entryPrice) / item.entryPrice) * 100 : 0;
            const returnPct = side === "SELL" ? -pnlPct : pnlPct;
            const result: TradeResult = item.outcome === "win" ? "TARGET HIT" : item.outcome === "loss" ? "STOP LOSS" : "PARTIAL";

            return {
              id: item._id,
              dateISO: date.toISOString().slice(0, 10),
              displayDate,
              closedAt: item.closedAt,
              stock: item.symbol,
              side,
              entry: item.entryPrice,
              target: item.exitPrice,
              stopLoss: item.entryPrice,
              high: Math.max(item.entryPrice, item.exitPrice),
              low: Math.min(item.entryPrice, item.exitPrice),
              result,
              returnPct,
              notes: item.notes,
              moveReason: item.moveReason,
              technicalAnalysis: item.technicalAnalysis,
              technicalPoints: item.technicalPoints ?? [],
              latestNews: item.latestNews ?? [],
              yearlyMovement: item.yearlyMovement ?? [],
              chartImageUrl: item.chartImageUrl,
            };
          })
          .filter((trade) => {
            // Show history only for completed past days. Current/future expiry stays out of history.
            const tradeDate = new Date(`${trade.dateISO}T00:00:00`);
            if (Number.isNaN(tradeDate.getTime())) return false;
            return tradeDate < todayStart;
          })
          .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
        ),
      )
      .catch(() => setRecords([]));

    void hitTraffic("/history", "GET");
  }, []);

  const filtered = useMemo(() => records.filter((trade) => {
    if (stockQuery && !trade.stock.toLowerCase().includes(stockQuery.toLowerCase().trim())) return false;
    if (resultFilter !== "ALL" && trade.result !== resultFilter) return false;
    if (sideFilter !== "ALL" && trade.side !== sideFilter) return false;
    if (downsideOnly && trade.returnPct >= 0) return false;
    if (fromDate && trade.dateISO < fromDate) return false;
    if (toDate && trade.dateISO > toDate) return false;
    return true;
  }), [stockQuery, resultFilter, sideFilter, downsideOnly, fromDate, toDate, records]);

  const downsideTrades = useMemo(() => records.filter((trade) => trade.returnPct < 0), [records]);

  const clearFilters = () => { setStockQuery(""); setResultFilter("ALL"); setSideFilter("ALL"); setFromDate(""); setToDate(""); setDownsideOnly(false); };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 text-gray-900 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 dark:text-gray-100">
      <header className="glass sticky top-0 z-50 border-b border-white/40 dark:border-gray-700/40"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-16"><div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Past Stock Predictions</p><h1 className="text-xl font-extrabold sm:text-2xl">Trading History</h1></div><Link href="/" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white">Back To Home</Link></div></header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-16">
        <section className="mb-8 grid gap-4 md:grid-cols-3"><div className="glass rounded-xl p-5"><p className="text-sm text-gray-600 dark:text-gray-400">Total History Records</p><p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{records.length}</p></div><div className="glass rounded-xl p-5"><p className="text-sm text-gray-600 dark:text-gray-400">Downside Records</p><p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{downsideTrades.length}</p></div><div className="glass rounded-xl p-5"><p className="text-sm text-gray-600 dark:text-gray-400">Filtered Results</p><p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{filtered.length}</p></div></section>

        <section className="glass mb-8 rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-xl font-bold">Filter Trading History</h2><button type="button" onClick={clearFilters} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 sm:w-auto">Clear Filters</button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Search<input type="text" value={stockQuery} onChange={(e) => setStockQuery(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-900" /></label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Result<select value={resultFilter} onChange={(e) => setResultFilter(e.target.value as "ALL" | TradeResult)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-900"><option value="ALL">All Results</option><option value="TARGET HIT">Target Hit</option><option value="STOP LOSS">Stop Loss</option><option value="PARTIAL">Partial</option></select></label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Side<select value={sideFilter} onChange={(e) => setSideFilter(e.target.value as "ALL" | TradeSide)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-900"><option value="ALL">All Sides</option><option value="BUY">Buy</option><option value="SELL">Sell</option></select></label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">From Date<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-900" /></label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">To Date<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-900" /></label>
            <label className="flex items-center gap-3 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300"><input type="checkbox" checked={downsideOnly} onChange={(e) => setDownsideOnly(e.target.checked)} className="h-4 w-4" />Show Downside Only</label>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Downside Analysis Cards</h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">{downsideTrades.length} records</span>
          </div>
          {downsideTrades.length === 0 && (
            <div className="glass rounded-2xl p-5 text-sm font-semibold">No downside records available.</div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {downsideTrades.map((trade) => (
              <article key={trade.id} className="glass rounded-2xl p-5 shadow-lg">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold">{trade.stock}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{trade.displayDate}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${resultPill(trade.result)}`}>{trade.result}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Entry</span><p className="font-semibold">{formatInr(trade.entry)}</p></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Exit</span><p className="font-semibold">{formatInr(trade.target)}</p></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Return</span><p className="font-semibold text-red-600 dark:text-red-400">{formatPct(trade.returnPct)}</p></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Side</span><p className="font-semibold">{trade.side}</p></div>
                </div>
                <div className="mt-4 rounded-xl bg-gray-100 p-3 dark:bg-gray-800/70">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Technical Analysis</p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                    {(trade.technicalPoints?.[0] || trade.moveReason || trade.technicalAnalysis || trade.notes || "Detailed downside reason is available in full breakdown.").slice(0, 140)}
                    {(trade.technicalPoints?.[0] || trade.moveReason || trade.technicalAnalysis || trade.notes || "").length > 140 ? "..." : ""}
                  </p>
                </div>
                <Link
                  href={`/history/${trade.id}`}
                  className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-500 hover:to-blue-500"
                >
                  Learn More
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl shadow-xl"><div className="glass overflow-x-auto"><table className="w-full min-w-[1080px]"><thead className="bg-gray-100 dark:bg-gray-800"><tr className="text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400"><th className="px-5 py-4">Date</th><th className="px-5 py-4">Stock</th><th className="px-5 py-4">Side</th><th className="px-5 py-4">Entry</th><th className="px-5 py-4">Target</th><th className="px-5 py-4">Stop Loss</th><th className="px-5 py-4">Actual High</th><th className="px-5 py-4">Actual Low</th><th className="px-5 py-4">Result</th><th className="px-5 py-4">Return</th><th className="px-5 py-4">Details</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{filtered.map((trade) => (<tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50"><td className="px-5 py-4 font-mono text-sm">{trade.displayDate}</td><td className="px-5 py-4 text-sm font-bold">{trade.stock}</td><td className="px-5 py-4 text-sm">{trade.side}</td><td className="px-5 py-4 font-mono text-sm">{formatInr(trade.entry)}</td><td className="px-5 py-4 font-mono text-sm">{formatInr(trade.target)}</td><td className="px-5 py-4 font-mono text-sm">{formatInr(trade.stopLoss)}</td><td className="px-5 py-4 font-mono text-sm">{formatInr(trade.high)}</td><td className="px-5 py-4 font-mono text-sm">{formatInr(trade.low)}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${resultPill(trade.result)}`}>{trade.result}</span></td><td className={`px-5 py-4 text-sm font-bold ${trade.returnPct < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{formatPct(trade.returnPct)}</td><td className="px-5 py-4"><Link href={`/history/${trade.id}`} className="rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white">Open</Link></td></tr>))}</tbody></table></div></section>
      </main>
    </div>
  );
}
