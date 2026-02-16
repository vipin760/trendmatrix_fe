"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { fetchPredictions, type PredictionItem } from "@/lib/client/trading-api";

function rr(item: PredictionItem) {
  const target = Number(item.targets?.[0]?.price ?? item.entryPrice);
  const risk = Math.abs(Number(item.entryPrice) - Number(item.stopLoss));
  const reward = Math.abs(target - Number(item.entryPrice));
  if (risk <= 0) return "1:0.00";
  return `1:${(reward / risk).toFixed(2)}`;
}

function isSameDayLocal(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function Home() {
  const [items, setItems] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPredictions({ page: 1, limit: 20, sort: "-expiresAt", status: "active", market: "stocks" })
      .then((res) => setItems(res.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const today = items.filter((item) => isSameDayLocal(item.expiresAt));
  const cards = (today.length > 0 ? today : items).slice(0, 6);

  return (
    <>
      <Header />
      <section className="py-16 text-center">
        <h1 className="mb-6 text-5xl font-bold">
          Daily Intraday Research &
          <span className="text-emerald-600"> Transparency Report</span>
        </h1>
        <p className="mx-auto max-w-xl text-gray-500">
          Research-based intraday predictions with documented results.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Today&apos;s Prediction Cards</h2>
          <Link href="/intraday" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
            Open Intraday Page
          </Link>
        </div>

        {loading && <p className="text-sm font-semibold text-gray-600">Loading predictions...</p>}
        {!loading && cards.length === 0 && <p className="text-sm font-semibold text-gray-600">No active predictions available.</p>}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((item) => {
            const target = Number(item.targets?.[0]?.price ?? item.entryPrice);
            const side = item.direction === "long" ? "BUY" : "SELL";
            const sideClasses =
              side === "BUY"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
            return (
              <article
                key={item._id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{item.symbol}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                      {`${item.market === "stocks" ? "NSE" : item.market.toUpperCase()}: ${item.symbol}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${sideClasses}`}>
                    {side}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Metric label="Entry" value={`INR ${Number(item.entryPrice).toFixed(2)}`} />
                  <Metric label="Target" value={`INR ${target.toFixed(2)}`} />
                  <Metric label="Stop" value={`INR ${Number(item.stopLoss).toFixed(2)}`} />
                  <Metric label="R/R" value={rr(item)} />
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {item.upsideReason || item.reasoning || "Technical setup active."}
                </p>

                <Link
                  href={`/intraday/${item._id}`}
                  className="mt-4 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Show More
                </Link>
              </article>
            );
          })}
        </div>
      </section>
      <Footer />
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
