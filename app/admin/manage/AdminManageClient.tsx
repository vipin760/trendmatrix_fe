"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createPrediction,
  deleteHistory,
  deletePrediction,
  fetchHistory,
  fetchPredictions,
  type HistoryItem,
  type PredictionItem,
  updateHistory,
  updatePrediction,
} from "@/lib/client/trading-api";

type PredictionForm = {
  symbol: string;
  market: string;
  timeframe: string;
  direction: "long" | "short";
  confidence: string;
  entryPrice: string;
  stopLoss: string;
  target1: string;
  target2: string;
  upsideReason: string;
  reasoning: string;
  technicalAnalysis: string;
  technicalPointsText: string;
  expiresAt: string;
};

type HistoryForm = {
  predictionId: string;
  symbol: string;
  market: string;
  timeframe: string;
  direction: "long" | "short";
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  fees: string;
  strategyTag: string;
  notes: string;
  moveReason: string;
  technicalAnalysis: string;
  technicalPointsText: string;
  latestNewsText: string;
  yearlyMovementText: string;
  chartImageUrl: string;
  openedAt: string;
  closedAt: string;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const emptyPrediction: PredictionForm = {
  symbol: "",
  market: "stocks",
  timeframe: "1h",
  direction: "long",
  confidence: "75",
  entryPrice: "",
  stopLoss: "",
  target1: "",
  target2: "",
  upsideReason: "",
  reasoning: "",
  technicalAnalysis: "",
  technicalPointsText: "",
  expiresAt: "",
};

const emptyHistory: HistoryForm = {
  predictionId: "",
  symbol: "",
  market: "stocks",
  timeframe: "1h",
  direction: "long",
  entryPrice: "",
  exitPrice: "",
  quantity: "1",
  fees: "0",
  strategyTag: "",
  notes: "",
  moveReason: "",
  technicalAnalysis: "",
  technicalPointsText: "",
  latestNewsText: "",
  yearlyMovementText: "",
  chartImageUrl: "",
  openedAt: "",
  closedAt: "",
};

function defaultPagination(limit = 10): PaginationMeta {
  return { page: 1, limit, total: 0, pages: 1 };
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatDateInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${mm}`;
}

function normalizeLegacyAnalysis(value?: string[] | string) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split("\n").map((item) => item.trim()).filter(Boolean);
  return [];
}

function extractRefId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const maybeId = (value as { _id?: unknown })._id;
    return typeof maybeId === "string" ? maybeId : "";
  }
  return "";
}

export default function AdminManageClient() {
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [predictionForm, setPredictionForm] = useState<PredictionForm>(emptyPrediction);
  const [historyForm, setHistoryForm] = useState<HistoryForm>(emptyHistory);
  const [predictionEditId, setPredictionEditId] = useState<string | null>(null);
  const [historyEditId, setHistoryEditId] = useState<string | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  const [predictionSearch, setPredictionSearch] = useState("");
  const [predictionDirection, setPredictionDirection] = useState("all");
  const [predictionSort, setPredictionSort] = useState("-createdAt");
  const [predictionPagination, setPredictionPagination] = useState<PaginationMeta>(defaultPagination(10));

  const [historySearch, setHistorySearch] = useState("");
  const [historyOutcome, setHistoryOutcome] = useState("all");
  const [historySort, setHistorySort] = useState("-closedAt");
  const [historyPagination, setHistoryPagination] = useState<PaginationMeta>(defaultPagination(10));

  const loadPredictions = async () => {
    setLoadingPredictions(true);
    setError("");
    try {
      const res = await fetchPredictions({
        page: predictionPagination.page,
        limit: predictionPagination.limit,
        sort: predictionSort,
        symbol: predictionSearch || undefined,
        direction: predictionDirection === "all" ? undefined : predictionDirection,
      });
      setPredictions(res.items ?? []);
      if (res.pagination) setPredictionPagination(res.pagination);
    } catch {
      setError("Unable to load predictions");
      setPredictions([]);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    setError("");
    try {
      const res = await fetchHistory({
        page: historyPagination.page,
        limit: historyPagination.limit,
        sort: historySort,
        symbol: historySearch || undefined,
        outcome: historyOutcome === "all" ? undefined : historyOutcome,
      });
      setHistory(res.items ?? []);
      if (res.pagination) setHistoryPagination(res.pagination);
    } catch {
      setError("Unable to load history");
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadPredictions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictionPagination.page, predictionPagination.limit, predictionSort, predictionDirection]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setPredictionPagination((s) => ({ ...s, page: 1 }));
      void loadPredictions();
    }, 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictionSearch]);

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPagination.page, historyPagination.limit, historySort, historyOutcome]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setHistoryPagination((s) => ({ ...s, page: 1 }));
      void loadHistory();
    }, 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historySearch]);

  const submitPrediction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      symbol: predictionForm.symbol,
      market: predictionForm.market,
      timeframe: predictionForm.timeframe,
      direction: predictionForm.direction,
      confidence: Number(predictionForm.confidence),
      entryPrice: Number(predictionForm.entryPrice),
      stopLoss: Number(predictionForm.stopLoss),
      targets: [predictionForm.target1, predictionForm.target2]
        .filter(Boolean)
        .map((price) => ({ price: Number(price) })),
      upsideReason: predictionForm.upsideReason,
      reasoning: predictionForm.reasoning,
      technicalAnalysis: predictionForm.technicalAnalysis,
      technicalPoints: predictionForm.technicalPointsText.split("\n").map((item) => item.trim()).filter(Boolean),
      indicators: [],
      expiresAt: predictionForm.expiresAt ? new Date(predictionForm.expiresAt).toISOString() : undefined,
    };

    try {
      if (predictionEditId) await updatePrediction(predictionEditId, payload);
      else await createPrediction(payload);
      setPredictionForm(emptyPrediction);
      setPredictionEditId(null);
      await loadPredictions();
      await loadHistory();
    } catch {
      setError("Failed to save prediction");
    }
  };

  const submitHistory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!historyEditId) {
      setError("History can only be updated. Click Edit on an existing history row.");
      return;
    }

    const normalizedPredictionId = historyForm.predictionId.trim();
    const predictionId = /^[a-f\d]{24}$/i.test(normalizedPredictionId) ? normalizedPredictionId : undefined;

    const payload = {
      predictionId,
      symbol: historyForm.symbol,
      market: historyForm.market,
      timeframe: historyForm.timeframe,
      direction: historyForm.direction,
      entryPrice: Number(historyForm.entryPrice),
      exitPrice: Number(historyForm.exitPrice),
      quantity: Number(historyForm.quantity),
      fees: Number(historyForm.fees),
      strategyTag: historyForm.strategyTag,
      notes: historyForm.notes,
      moveReason: historyForm.moveReason,
      technicalAnalysis: historyForm.technicalAnalysis,
      technicalPoints: historyForm.technicalPointsText.split("\n").map((item) => item.trim()).filter(Boolean),
      latestNews: historyForm.latestNewsText.split("\n").map((item) => item.trim()).filter(Boolean),
      yearlyMovement: historyForm.yearlyMovementText.split("\n").map((item) => item.trim()).filter(Boolean),
      chartImageUrl: historyForm.chartImageUrl,
      openedAt: new Date(historyForm.openedAt).toISOString(),
      closedAt: new Date(historyForm.closedAt).toISOString(),
    };

    try {
      await updateHistory(historyEditId, payload);
      setHistoryForm(emptyHistory);
      setHistoryEditId(null);
      await loadHistory();
    } catch {
      setError("Failed to save history");
    }
  };

  const onDeletePrediction = async (id: string) => {
    if (!window.confirm("Delete this prediction?")) return;
    try {
      await deletePrediction(id);
      await loadPredictions();
      await loadHistory();
    } catch {
      setError("Failed to delete prediction");
    }
  };

  const onDeleteHistory = async (id: string) => {
    if (!window.confirm("Delete this history record?")) return;
    try {
      await deleteHistory(id);
      await loadHistory();
    } catch {
      setError("Failed to delete history");
    }
  };

  const predictionsLoadingText = useMemo(
    () => (loadingPredictions ? "Loading predictions..." : predictions.length === 0 ? "No predictions found." : ""),
    [loadingPredictions, predictions.length],
  );

  const historyLoadingText = useMemo(
    () => (loadingHistory ? "Loading history..." : history.length === 0 ? "No history found." : ""),
    [loadingHistory, history.length],
  );

  return (
    <div className="space-y-8">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-xl font-bold text-gray-900">Predictions</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={submitPrediction}>
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Symbol" value={predictionForm.symbol} onChange={(e) => setPredictionForm((s) => ({ ...s, symbol: e.target.value }))} required />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Market (stocks/indices/...)" value={predictionForm.market} onChange={(e) => setPredictionForm((s) => ({ ...s, market: e.target.value }))} required />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Timeframe" value={predictionForm.timeframe} onChange={(e) => setPredictionForm((s) => ({ ...s, timeframe: e.target.value }))} required />
          <select className="rounded-lg border border-gray-300 px-3 py-2" value={predictionForm.direction} onChange={(e) => setPredictionForm((s) => ({ ...s, direction: e.target.value as "long" | "short" }))}><option value="long">long</option><option value="short">short</option></select>
          <input type="number" className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Confidence" value={predictionForm.confidence} onChange={(e) => setPredictionForm((s) => ({ ...s, confidence: e.target.value }))} />
          <input type="number" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Entry Price" value={predictionForm.entryPrice} onChange={(e) => setPredictionForm((s) => ({ ...s, entryPrice: e.target.value }))} required />
          <input type="number" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Stop Loss" value={predictionForm.stopLoss} onChange={(e) => setPredictionForm((s) => ({ ...s, stopLoss: e.target.value }))} required />
          <input type="number" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Target 1" value={predictionForm.target1} onChange={(e) => setPredictionForm((s) => ({ ...s, target1: e.target.value }))} />
          <input type="number" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Target 2" value={predictionForm.target2} onChange={(e) => setPredictionForm((s) => ({ ...s, target2: e.target.value }))} />
          <input type="datetime-local" className="rounded-lg border border-gray-300 px-3 py-2" value={predictionForm.expiresAt} onChange={(e) => setPredictionForm((s) => ({ ...s, expiresAt: e.target.value }))} />
          <textarea className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" rows={2} placeholder="Why stock may move up (shown to users)" value={predictionForm.upsideReason} onChange={(e) => setPredictionForm((s) => ({ ...s, upsideReason: e.target.value }))} />
          <textarea className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" rows={2} placeholder="Reasoning (technical details)" value={predictionForm.reasoning} onChange={(e) => setPredictionForm((s) => ({ ...s, reasoning: e.target.value }))} />
          <textarea className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" rows={4} placeholder="Technical analysis (long explanation)" value={predictionForm.technicalAnalysis} onChange={(e) => setPredictionForm((s) => ({ ...s, technicalAnalysis: e.target.value }))} />
          <textarea className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" rows={4} placeholder="Technical analysis points (one bullet per line)" value={predictionForm.technicalPointsText} onChange={(e) => setPredictionForm((s) => ({ ...s, technicalPointsText: e.target.value }))} />
          <div className="flex gap-2 md:col-span-3">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">{predictionEditId ? "Update Prediction" : "Add Prediction"}</button>
            {predictionEditId && <button type="button" onClick={() => { setPredictionEditId(null); setPredictionForm(emptyPrediction); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold">Cancel Edit</button>}
          </div>
        </form>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Search symbol" value={predictionSearch} onChange={(e) => setPredictionSearch(e.target.value)} />
          <select className="rounded-lg border border-gray-300 px-3 py-2" value={predictionDirection} onChange={(e) => { setPredictionDirection(e.target.value); setPredictionPagination((s) => ({ ...s, page: 1 })); }}><option value="all">All directions</option><option value="long">long</option><option value="short">short</option></select>
          <select className="rounded-lg border border-gray-300 px-3 py-2" value={predictionSort} onChange={(e) => { setPredictionSort(e.target.value); setPredictionPagination((s) => ({ ...s, page: 1 })); }}><option value="-createdAt">Newest</option><option value="createdAt">Oldest</option><option value="symbol">Symbol A-Z</option><option value="-symbol">Symbol Z-A</option><option value="-confidence">Confidence High-Low</option><option value="-riskReward">R/R High-Low</option></select>
          <select className="rounded-lg border border-gray-300 px-3 py-2" value={String(predictionPagination.limit)} onChange={(e) => setPredictionPagination((s) => ({ ...s, page: 1, limit: Number(e.target.value) }))}><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-3 py-2">Signal</th>
                <th className="px-3 py-2">Symbol</th>
                <th className="px-3 py-2">Exchange</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">Entry</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Stop</th>
                <th className="px-3 py-2">R/R</th>
                <th className="px-3 py-2">Posted</th>
                <th className="px-3 py-2">Why Up</th>
                <th className="px-3 py-2">Reasoning</th>
                <th className="px-3 py-2">Tech Analysis</th>
                <th className="px-3 py-2">Tech Points</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((item) => {
                const target = Number(item.targets?.[0]?.price ?? item.entryPrice);
                const rr = typeof item.riskReward === "number" ? item.riskReward : Math.abs(target - Number(item.entryPrice)) / Math.max(Math.abs(Number(item.entryPrice) - Number(item.stopLoss)), 1e-9);
                return (
                  <tr key={item._id} className="border-b border-gray-200 align-top">
                    <td className="px-3 py-2 font-semibold">{item.direction === "long" ? "BUY SIGNAL" : "SELL SIGNAL"}</td>
                    <td className="px-3 py-2 font-semibold">{item.symbol}</td>
                    <td className="px-3 py-2">{`${item.market === "stocks" ? "NSE" : item.market.toUpperCase()}: ${item.symbol}`}</td>
                    <td className="px-3 py-2">{Number(item.confidence) >= 70 ? "HIGH" : "MEDIUM"}</td>
                    <td className="px-3 py-2">INR {Number(item.entryPrice).toFixed(2)}</td>
                    <td className="px-3 py-2">INR {target.toFixed(2)}</td>
                    <td className="px-3 py-2">INR {Number(item.stopLoss).toFixed(2)}</td>
                    <td className="px-3 py-2">{`1:${rr.toFixed(2)}`}</td>
                    <td className="px-3 py-2">{formatDateTime(item.createdAt)}</td>
                    <td className="px-3 py-2">{item.upsideReason || "-"}</td>
                    <td className="px-3 py-2">{item.reasoning || "-"}</td>
                    <td className="px-3 py-2">{item.technicalAnalysis || "-"}</td>
                    <td className="px-3 py-2">{item.technicalPoints?.length ?? 0}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => {
                          const legacyAnalysis = normalizeLegacyAnalysis(item.analysis);
                          const fallbackUpsideReason = legacyAnalysis[0] ?? "";
                          const fallbackReasoning = legacyAnalysis.slice(1).join("\n");
                          const fallbackTechnicalPoints = legacyAnalysis;
                          setPredictionEditId(item._id);
                          setPredictionForm({
                            symbol: item.symbol,
                            market: item.market,
                            timeframe: item.timeframe,
                            direction: item.direction,
                            confidence: String(item.confidence),
                            entryPrice: String(item.entryPrice),
                            stopLoss: String(item.stopLoss),
                            target1: String(item.targets?.[0]?.price ?? ""),
                            target2: String(item.targets?.[1]?.price ?? ""),
                            upsideReason: item.upsideReason ?? fallbackUpsideReason,
                            reasoning: item.reasoning ?? fallbackReasoning,
                            technicalAnalysis: item.technicalAnalysis ?? item.reasoning ?? fallbackReasoning,
                            technicalPointsText: (item.technicalPoints && item.technicalPoints.length > 0 ? item.technicalPoints : fallbackTechnicalPoints).join("\n"),
                            expiresAt: formatDateInput(item.expiresAt),
                          });
                        }} className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">Edit</button>
                        <button type="button" onClick={() => onDeletePrediction(item._id)} className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {predictionsLoadingText && <p className="mt-3 text-sm text-gray-600">{predictionsLoadingText}</p>}
        <div className="mt-3 flex items-center justify-between text-sm">
          <p>{`Page ${predictionPagination.page} of ${predictionPagination.pages} | Total ${predictionPagination.total}`}</p>
          <div className="flex gap-2">
            <button type="button" disabled={predictionPagination.page <= 1 || loadingPredictions} onClick={() => setPredictionPagination((s) => ({ ...s, page: s.page - 1 }))} className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50">Prev</button>
            <button type="button" disabled={predictionPagination.page >= predictionPagination.pages || loadingPredictions} onClick={() => setPredictionPagination((s) => ({ ...s, page: s.page + 1 }))} className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50">Next</button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-xl font-bold text-gray-900">History (Edit Only)</h2>
        {!historyEditId && <p className="mt-2 text-sm text-gray-600">Click Edit in the table to update an existing history record.</p>}
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={submitHistory}>
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Prediction Id (optional)" value={historyForm.predictionId} onChange={(e) => setHistoryForm((s) => ({ ...s, predictionId: e.target.value }))} />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Symbol" value={historyForm.symbol} onChange={(e) => setHistoryForm((s) => ({ ...s, symbol: e.target.value }))} required />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Market" value={historyForm.market} onChange={(e) => setHistoryForm((s) => ({ ...s, market: e.target.value }))} required />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Timeframe" value={historyForm.timeframe} onChange={(e) => setHistoryForm((s) => ({ ...s, timeframe: e.target.value }))} required />
          <select className="rounded-lg border border-gray-300 px-3 py-2" value={historyForm.direction} onChange={(e) => setHistoryForm((s) => ({ ...s, direction: e.target.value as "long" | "short" }))}><option value="long">long</option><option value="short">short</option></select>
          <input type="number" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Entry Price" value={historyForm.entryPrice} onChange={(e) => setHistoryForm((s) => ({ ...s, entryPrice: e.target.value }))} required />
          <input type="number" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Exit Price" value={historyForm.exitPrice} onChange={(e) => setHistoryForm((s) => ({ ...s, exitPrice: e.target.value }))} required />
          <input type="number" step="0.0001" className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Quantity" value={historyForm.quantity} onChange={(e) => setHistoryForm((s) => ({ ...s, quantity: e.target.value }))} required />
          <input type="number" step="0.01" className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Fees" value={historyForm.fees} onChange={(e) => setHistoryForm((s) => ({ ...s, fees: e.target.value }))} />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Strategy Tag" value={historyForm.strategyTag} onChange={(e) => setHistoryForm((s) => ({ ...s, strategyTag: e.target.value }))} />
          <input type="datetime-local" className="rounded-lg border border-gray-300 px-3 py-2" value={historyForm.openedAt} onChange={(e) => setHistoryForm((s) => ({ ...s, openedAt: e.target.value }))} required />
          <input type="datetime-local" className="rounded-lg border border-gray-300 px-3 py-2" value={historyForm.closedAt} onChange={(e) => setHistoryForm((s) => ({ ...s, closedAt: e.target.value }))} required />
          <textarea className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" rows={2} placeholder="Why this stock moved (short reason)" value={historyForm.moveReason} onChange={(e) => setHistoryForm((s) => ({ ...s, moveReason: e.target.value }))} />
          <textarea className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" rows={4} placeholder="Technical analysis (full breakdown)" value={historyForm.technicalAnalysis} onChange={(e) => setHistoryForm((s) => ({ ...s, technicalAnalysis: e.target.value }))} />
          <textarea className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" rows={4} placeholder="Technical points (one bullet per line)" value={historyForm.technicalPointsText} onChange={(e) => setHistoryForm((s) => ({ ...s, technicalPointsText: e.target.value }))} />
          <textarea className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" rows={4} placeholder="Latest news (one line per item)" value={historyForm.latestNewsText} onChange={(e) => setHistoryForm((s) => ({ ...s, latestNewsText: e.target.value }))} />
          <textarea className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" rows={4} placeholder="Last year movement points (one line per item)" value={historyForm.yearlyMovementText} onChange={(e) => setHistoryForm((s) => ({ ...s, yearlyMovementText: e.target.value }))} />
          <input className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" placeholder="Graph image URL (optional)" value={historyForm.chartImageUrl} onChange={(e) => setHistoryForm((s) => ({ ...s, chartImageUrl: e.target.value }))} />
          <textarea className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-3" rows={2} placeholder="Notes" value={historyForm.notes} onChange={(e) => setHistoryForm((s) => ({ ...s, notes: e.target.value }))} />
          <div className="flex gap-2 md:col-span-3">
            <button type="submit" disabled={!historyEditId} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">Update History</button>
            {historyEditId && <button type="button" onClick={() => { setHistoryEditId(null); setHistoryForm(emptyHistory); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold">Cancel Edit</button>}
          </div>
        </form>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Search symbol" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
          <select className="rounded-lg border border-gray-300 px-3 py-2" value={historyOutcome} onChange={(e) => { setHistoryOutcome(e.target.value); setHistoryPagination((s) => ({ ...s, page: 1 })); }}><option value="all">All outcomes</option><option value="win">win</option><option value="loss">loss</option><option value="breakeven">breakeven</option></select>
          <select className="rounded-lg border border-gray-300 px-3 py-2" value={historySort} onChange={(e) => { setHistorySort(e.target.value); setHistoryPagination((s) => ({ ...s, page: 1 })); }}><option value="-closedAt">Closed Latest</option><option value="closedAt">Closed Oldest</option><option value="-pnlAmount">PnL High-Low</option><option value="pnlAmount">PnL Low-High</option><option value="symbol">Symbol A-Z</option></select>
          <select className="rounded-lg border border-gray-300 px-3 py-2" value={String(historyPagination.limit)} onChange={(e) => setHistoryPagination((s) => ({ ...s, page: 1, limit: Number(e.target.value) }))}><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead><tr className="bg-gray-100 text-left"><th className="px-3 py-2">Symbol</th><th className="px-3 py-2">Direction</th><th className="px-3 py-2">Entry</th><th className="px-3 py-2">Exit</th><th className="px-3 py-2">PnL</th><th className="px-3 py-2">Outcome</th><th className="px-3 py-2">Closed</th><th className="px-3 py-2">Actions</th></tr></thead>
            <tbody>
              {history.map((item) => (
                <tr key={item._id} className="border-b border-gray-200">
                  <td className="px-3 py-2 font-semibold">{item.symbol}</td>
                  <td className="px-3 py-2">{item.direction}</td>
                  <td className="px-3 py-2">{item.entryPrice}</td>
                  <td className="px-3 py-2">{item.exitPrice}</td>
                  <td className="px-3 py-2">{item.pnlAmount ?? "-"}</td>
                  <td className="px-3 py-2">{item.outcome ?? "-"}</td>
                  <td className="px-3 py-2">{formatDateTime(item.closedAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => {
                        setHistoryEditId(item._id);
                        setHistoryForm({
                          predictionId: extractRefId(item.predictionId),
                          symbol: item.symbol,
                          market: item.market,
                          timeframe: item.timeframe,
                          direction: item.direction,
                          entryPrice: String(item.entryPrice),
                          exitPrice: String(item.exitPrice),
                          quantity: String(item.quantity),
                          fees: String(item.fees ?? 0),
                          strategyTag: item.strategyTag ?? "",
                          notes: item.notes ?? "",
                          moveReason: item.moveReason ?? item.notes ?? "",
                          technicalAnalysis: item.technicalAnalysis ?? item.notes ?? "",
                          technicalPointsText: (item.technicalPoints ?? []).join("\n"),
                          latestNewsText: (item.latestNews ?? []).join("\n"),
                          yearlyMovementText: (item.yearlyMovement ?? []).join("\n"),
                          chartImageUrl: item.chartImageUrl ?? "",
                          openedAt: formatDateInput(item.openedAt),
                          closedAt: formatDateInput(item.closedAt),
                        });
                      }} className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">Edit</button>
                      <button type="button" onClick={() => onDeleteHistory(item._id)} className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {historyLoadingText && <p className="mt-3 text-sm text-gray-600">{historyLoadingText}</p>}
        <div className="mt-3 flex items-center justify-between text-sm">
          <p>{`Page ${historyPagination.page} of ${historyPagination.pages} | Total ${historyPagination.total}`}</p>
          <div className="flex gap-2">
            <button type="button" disabled={historyPagination.page <= 1 || loadingHistory} onClick={() => setHistoryPagination((s) => ({ ...s, page: s.page - 1 }))} className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50">Prev</button>
            <button type="button" disabled={historyPagination.page >= historyPagination.pages || loadingHistory} onClick={() => setHistoryPagination((s) => ({ ...s, page: s.page + 1 }))} className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50">Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
