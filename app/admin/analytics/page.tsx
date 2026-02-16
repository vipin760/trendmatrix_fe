"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/client/auth-api";
import {
  fetchBlockedClients,
  fetchTrafficActors,
  fetchTrafficInsights,
  fetchVisitorOverview,
  type BlockedClient,
  type TrafficActor,
  type TrafficInsight,
  type VisitorOverview,
} from "@/lib/client/trading-api";

type SortOrder = "asc" | "desc";
type RouteSortKey = "route" | "hits" | "uniqueUsers" | "lastHitAt";
type DailySortKey = "date" | "hits" | "uniqueUsers";

const PERIOD_OPTIONS = [7, 30, 90, 365] as const;

function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsvRow(values: Array<string | number>) {
  return values
    .map((value) => {
      const text = String(value ?? "");
      if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
      return text;
    })
    .join(",");
}

function buildLinePath(points: number[], width: number, height: number) {
  if (points.length === 0) return "";
  const max = Math.max(...points, 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  return points
    .map((point, i) => {
      const x = i * stepX;
      const y = height - (point / max) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [periodDays, setPeriodDays] = useState<number>(30);
  const [routeFilter, setRouteFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all");

  const [routeSortKey, setRouteSortKey] = useState<RouteSortKey>("hits");
  const [routeSortOrder, setRouteSortOrder] = useState<SortOrder>("desc");
  const [dailySortKey, setDailySortKey] = useState<DailySortKey>("date");
  const [dailySortOrder, setDailySortOrder] = useState<SortOrder>("asc");

  const [traffic, setTraffic] = useState<TrafficInsight | null>(null);
  const [visitors, setVisitors] = useState<VisitorOverview | null>(null);
  const [actors, setActors] = useState<TrafficActor[]>([]);
  const [blockedClients, setBlockedClients] = useState<BlockedClient[]>([]);

  const loadAnalytics = async (days: number, risk: "all" | "low" | "medium" | "high" | "critical") => {
    setLoading(true);
    setError("");
    try {
      const [trafficPayload, visitorPayload, actorPayload, blockedPayload] = await Promise.all([
        fetchTrafficInsights(days),
        fetchVisitorOverview(),
        fetchTrafficActors({ page: 1, limit: 100, days, risk }),
        fetchBlockedClients({ page: 1, limit: 100 }),
      ]);
      setTraffic(trafficPayload);
      setVisitors(visitorPayload);
      setActors(actorPayload.items ?? []);
      setBlockedClients(blockedPayload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void getMe()
      .then(() => setReady(true))
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    void loadAnalytics(periodDays, riskFilter);
  }, [ready, periodDays, riskFilter]);

  const filteredRoutes = useMemo(() => {
    const list = (traffic?.routes ?? []).filter((item) =>
      routeFilter ? item.route.toLowerCase().includes(routeFilter.toLowerCase().trim()) : true
    );

    const sorted = [...list].sort((a, b) => {
      const dir = routeSortOrder === "asc" ? 1 : -1;
      if (routeSortKey === "route") return a.route.localeCompare(b.route) * dir;
      if (routeSortKey === "hits") return (a.hits - b.hits) * dir;
      if (routeSortKey === "uniqueUsers") return (a.uniqueUsers - b.uniqueUsers) * dir;
      return (new Date(a.lastHitAt || 0).getTime() - new Date(b.lastHitAt || 0).getTime()) * dir;
    });
    return sorted;
  }, [traffic, routeFilter, routeSortKey, routeSortOrder]);

  const sortedDaily = useMemo(() => {
    const list = [...(traffic?.daily ?? [])];
    return list.sort((a, b) => {
      const dir = dailySortOrder === "asc" ? 1 : -1;
      if (dailySortKey === "date") return a.date.localeCompare(b.date) * dir;
      if (dailySortKey === "hits") return (a.hits - b.hits) * dir;
      return (a.uniqueUsers - b.uniqueUsers) * dir;
    });
  }, [traffic, dailySortKey, dailySortOrder]);

  const totals = useMemo(() => {
    const daily = traffic?.daily ?? [];
    const totalHits = daily.reduce((sum, d) => sum + d.hits, 0);
    const totalUnique = daily.reduce((sum, d) => sum + d.uniqueUsers, 0);
    const avgHits = daily.length ? totalHits / daily.length : 0;
    const avgUnique = daily.length ? totalUnique / daily.length : 0;
    return { totalHits, totalUnique, avgHits, avgUnique };
  }, [traffic]);

  const hitTrendPath = useMemo(() => buildLinePath((traffic?.daily ?? []).map((d) => d.hits), 720, 160), [traffic]);
  const uniqueTrendPath = useMemo(
    () => buildLinePath((traffic?.daily ?? []).map((d) => d.uniqueUsers), 720, 160),
    [traffic]
  );

  const exportRoutesCsv = () => {
    const header = toCsvRow(["Route", "Hits", "Unique Users", "Last Hit At"]);
    const rows = filteredRoutes.map((r) => toCsvRow([r.route, r.hits, r.uniqueUsers, r.lastHitAt || ""]));
    downloadTextFile(`traffic-routes-${periodDays}d.csv`, [header, ...rows].join("\n"), "text/csv;charset=utf-8");
  };

  const exportDailyCsv = () => {
    const header = toCsvRow(["Date", "Hits", "Unique Users"]);
    const rows = sortedDaily.map((d) => toCsvRow([d.date, d.hits, d.uniqueUsers]));
    downloadTextFile(`traffic-daily-${periodDays}d.csv`, [header, ...rows].join("\n"), "text/csv;charset=utf-8");
  };

  const exportAnalyticsJson = () => {
    downloadTextFile(
      `analytics-snapshot-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ periodDays, traffic, visitors, actors, blockedClients }, null, 2),
      "application/json;charset=utf-8"
    );
  };

  if (!ready || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-100 to-emerald-100">
        <p className="text-sm font-semibold text-gray-700">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-emerald-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Detailed Traffic Analytics</h1>
            <p className="text-sm text-gray-600">Deduplicated visitor analytics for ad-partner trust reporting.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/dashboard" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700">
              Back to Dashboard
            </Link>
          </div>
        </header>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-semibold text-gray-700">
              Period
              <select
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
                value={String(periodDays)}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
              >
                {PERIOD_OPTIONS.map((d) => (
                  <option key={d} value={d}>{`${d} Days`}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Route Filter
              <input
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                placeholder="/history or /intraday"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Risk Filter
              <select
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as "all" | "low" | "medium" | "high" | "critical")}
              >
                <option value="all">all</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </label>
            <button type="button" onClick={exportDailyCsv} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
              Export Daily CSV
            </button>
            <button type="button" onClick={exportRoutesCsv} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Export Route CSV
            </button>
            <button type="button" onClick={exportAnalyticsJson} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
              Export Full JSON
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Unique Today" value={String(visitors?.uniqueVisitors.today ?? 0)} />
          <StatCard label="Unique 7D" value={String(visitors?.uniqueVisitors.last7Days ?? 0)} />
          <StatCard label="Unique 30D" value={String(visitors?.uniqueVisitors.last30Days ?? 0)} />
          <StatCard label="Unique 365D" value={String(visitors?.uniqueVisitors.last365Days ?? 0)} />
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard label={`Total Hits (${periodDays}D)`} value={String(totals.totalHits)} />
          <StatCard label={`Total Unique (${periodDays}D)`} value={String(totals.totalUnique)} />
          <StatCard label="Avg Hits/Day" value={totals.avgHits.toFixed(1)} />
          <StatCard label="Avg Unique/Day" value={totals.avgUnique.toFixed(1)} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Daily Hits Trend</h2>
            <svg viewBox="0 0 720 160" className="mt-4 h-44 w-full rounded bg-gray-50 p-2">
              <path d={hitTrendPath} fill="none" stroke="#2563eb" strokeWidth="3" />
            </svg>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Daily Unique Trend</h2>
            <svg viewBox="0 0 720 160" className="mt-4 h-44 w-full rounded bg-gray-50 p-2">
              <path d={uniqueTrendPath} fill="none" stroke="#059669" strokeWidth="3" />
            </svg>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Daily Breakdown</h2>
            <select className="rounded-lg border border-gray-300 px-2 py-1 text-sm" value={dailySortKey} onChange={(e) => setDailySortKey(e.target.value as DailySortKey)}>
              <option value="date">Sort by date</option>
              <option value="hits">Sort by hits</option>
              <option value="uniqueUsers">Sort by unique users</option>
            </select>
            <select className="rounded-lg border border-gray-300 px-2 py-1 text-sm" value={dailySortOrder} onChange={(e) => setDailySortOrder(e.target.value as SortOrder)}>
              <option value="asc">asc</option>
              <option value="desc">desc</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Hits</th>
                  <th className="px-3 py-2">Unique Users</th>
                </tr>
              </thead>
              <tbody>
                {sortedDaily.map((d) => (
                  <tr key={d.date} className="border-b border-gray-200">
                    <td className="px-3 py-2">{d.date}</td>
                    <td className="px-3 py-2">{d.hits}</td>
                    <td className="px-3 py-2">{d.uniqueUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedDaily.length === 0 && <p className="mt-3 text-sm text-gray-600">No daily data for selected period.</p>}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Route Performance</h2>
            <select className="rounded-lg border border-gray-300 px-2 py-1 text-sm" value={routeSortKey} onChange={(e) => setRouteSortKey(e.target.value as RouteSortKey)}>
              <option value="hits">Sort by hits</option>
              <option value="uniqueUsers">Sort by unique users</option>
              <option value="route">Sort by route</option>
              <option value="lastHitAt">Sort by last hit</option>
            </select>
            <select className="rounded-lg border border-gray-300 px-2 py-1 text-sm" value={routeSortOrder} onChange={(e) => setRouteSortOrder(e.target.value as SortOrder)}>
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-3 py-2">Route</th>
                  <th className="px-3 py-2">Hits</th>
                  <th className="px-3 py-2">Unique Users</th>
                  <th className="px-3 py-2">Last Hit At</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((r) => (
                  <tr key={r.route} className="border-b border-gray-200">
                    <td className="px-3 py-2 font-semibold">{r.route}</td>
                    <td className="px-3 py-2">{r.hits}</td>
                    <td className="px-3 py-2">{r.uniqueUsers}</td>
                    <td className="px-3 py-2">{r.lastHitAt ? new Date(r.lastHitAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRoutes.length === 0 && <p className="mt-3 text-sm text-gray-600">No routes match this filter.</p>}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Suspicious Actors</h2>
            <div className="mt-3 space-y-2 text-sm">
              {actors.slice(0, 20).map((a) => (
                <div key={a._id} className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold uppercase">{a.riskLevel}</span>
                    <span>Score {a.suspicionScore}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">Hits: {a.totalHits} | 1m burst: {a.hitsLastMinute}</p>
                  <p className="mt-1 text-xs text-gray-600">Reasons: {a.reasons?.join(", ") || "-"}</p>
                </div>
              ))}
              {actors.length === 0 && <p className="text-gray-500">No suspicious actor data.</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Active Blocked Clients</h2>
            <div className="mt-3 space-y-2 text-sm">
              {blockedClients.map((b) => (
                <div key={b._id} className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{b.type}</span>
                    <span>{b.expiresAt ? new Date(b.expiresAt).toLocaleString() : "Never"}</span>
                  </div>
                  <p className="mt-1 break-all text-xs text-gray-600">{b.value}</p>
                  <p className="mt-1 text-xs text-gray-600">Reason: {b.reason || "-"}</p>
                </div>
              ))}
              {blockedClients.length === 0 && <p className="text-gray-500">No active blocked clients.</p>}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900">Methodology For Ad Partners</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>Visitor count is deduplicated by fingerprint; repeated hits by same visitor are not overcounted.</li>
            <li>Traffic quality includes risk-scoring to separate normal users and suspicious automation behavior.</li>
            <li>All metrics are time-window filterable and exportable in CSV/JSON for independent verification.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-2 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
