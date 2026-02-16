"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/client/auth-api";
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchBlockedClients,
  fetchManualIntradayUpdateStatus,
  fetchTrafficActors,
  fetchTrafficInsights,
  fetchVisitorOverview,
  setAdminUserBlocked,
  setTrafficActorBlocked,
  type BlockedClient,
  triggerAutomaticIntradayUpdate,
  type AdminUser,
  type AdminStats,
  type AutomaticIntradayUpdateResponse,
  type ManualIntradayUpdateStatus,
  type TrafficActor,
  type TrafficInsight,
  type VisitorOverview,
} from "@/lib/client/trading-api";
import { AdminLogoutButton } from "./AdminLogoutButton";

type MeResponse = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [manualStatus, setManualStatus] = useState<ManualIntradayUpdateStatus | null>(null);
  const [trafficInsights, setTrafficInsights] = useState<TrafficInsight | null>(null);
  const [visitorOverview, setVisitorOverview] = useState<VisitorOverview | null>(null);
  const [trafficActors, setTrafficActors] = useState<TrafficActor[]>([]);
  const [blockedClients, setBlockedClients] = useState<BlockedClient[]>([]);
  const [trafficActorsLoading, setTrafficActorsLoading] = useState(false);
  const [trafficActorsError, setTrafficActorsError] = useState("");
  const [trafficActorSearch, setTrafficActorSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [autoUpdateResult, setAutoUpdateResult] = useState<AutomaticIntradayUpdateResponse | null>(null);
  const [autoUpdating, setAutoUpdating] = useState(false);
  const [autoUpdateError, setAutoUpdateError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async (search = "") => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const payload = await fetchAdminUsers({ page: 1, limit: 20, search: search || undefined });
      setUsers(payload.items ?? []);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Unable to load users");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadTrafficActors = async (search = "") => {
    setTrafficActorsLoading(true);
    setTrafficActorsError("");
    try {
      const [actorsPayload, blockedPayload] = await Promise.all([
        fetchTrafficActors({ page: 1, limit: 20, days: 14, risk: "all", search: search || undefined }),
        fetchBlockedClients({ page: 1, limit: 20 }),
      ]);
      setTrafficActors(actorsPayload.items ?? []);
      setBlockedClients(blockedPayload.items ?? []);
    } catch (error) {
      setTrafficActorsError(error instanceof Error ? error.message : "Unable to load suspicious traffic actors");
      setTrafficActors([]);
      setBlockedClients([]);
    } finally {
      setTrafficActorsLoading(false);
    }
  };

  useEffect(() => {
    void getMe()
      .then(async (payload) => {
        setMe(payload as MeResponse);
        const [statsPayload, manualStatusPayload, trafficPayload, visitorOverviewPayload] = await Promise.all([
          fetchAdminStats(30),
          fetchManualIntradayUpdateStatus(),
          fetchTrafficInsights(14),
          fetchVisitorOverview(),
        ]);
        setStats(statsPayload);
        setManualStatus(manualStatusPayload);
        setTrafficInsights(trafficPayload);
        setVisitorOverview(visitorOverviewPayload);
        await loadTrafficActors();
        await loadUsers();
      })
      .catch(() => {
        router.replace("/admin/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleAutoUpdate = async () => {
    setAutoUpdating(true);
    setAutoUpdateError("");
    try {
      const result = await triggerAutomaticIntradayUpdate();
      setAutoUpdateResult(result);
      const [statsPayload, manualStatusPayload, trafficPayload, visitorOverviewPayload] = await Promise.all([
        fetchAdminStats(30),
        fetchManualIntradayUpdateStatus(),
        fetchTrafficInsights(14),
        fetchVisitorOverview(),
      ]);
      setStats(statsPayload);
      setManualStatus(manualStatusPayload);
      setTrafficInsights(trafficPayload);
      setVisitorOverview(visitorOverviewPayload);
      await loadTrafficActors(trafficActorSearch);
      await loadUsers(userSearch);
    } catch (error) {
      setAutoUpdateError(error instanceof Error ? error.message : "Automatic intraday update failed");
    } finally {
      setAutoUpdating(false);
    }
  };

  const handleToggleUserBlock = async (user: AdminUser) => {
    const nextBlocked = !Boolean(user.isBlocked);
    const reason = nextBlocked ? window.prompt("Enter block reason (optional):", user.blockedReason || "") ?? "" : "";
    try {
      await setAdminUserBlocked(user._id, nextBlocked, reason);
      await loadUsers(userSearch);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Unable to update user");
    }
  };

  const handleToggleTrafficActorBlock = async (actor: TrafficActor) => {
    const nextBlocked = !actor.isBlocked;
    const reason = nextBlocked ? window.prompt("Reason for blocking this client:", actor.blockedReason || "") ?? "" : "";
    const durationHours = nextBlocked
      ? Number(window.prompt("Block duration in hours (default 24):", "24") || "24")
      : 0;
    try {
      await setTrafficActorBlocked(actor._id, nextBlocked, reason, durationHours > 0 ? durationHours : 24);
      await loadTrafficActors(trafficActorSearch);
    } catch (error) {
      setTrafficActorsError(error instanceof Error ? error.message : "Unable to update client block");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-100 to-emerald-100">
        <p className="text-sm font-semibold text-gray-700">Checking admin session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-emerald-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Authenticated with your external backend</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoUpdate}
              disabled={autoUpdating}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {autoUpdating ? "Running Auto Update..." : "Automatic Stock Update"}
            </button>
            <Link href="/admin/manage" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
              Manage Data
            </Link>
            <Link href="/admin/analytics" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
              Detailed Analytics
            </Link>
            <AdminLogoutButton />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Name" value={me?.name ?? "N/A"} />
          <StatCard label="Email" value={me?.email ?? "N/A"} />
          <StatCard label="Role" value={me?.role ?? "N/A"} />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard label="Predictions" value={String(stats?.predictions.total ?? 0)} />
          <StatCard label="Trades" value={String(stats?.history.totalTrades ?? 0)} />
          <StatCard label="Win Rate" value={`${stats?.history.winRate?.toFixed(1) ?? "0.0"}%`} />
          <StatCard label="Traffic Hits" value={String(stats?.traffic.totalHits ?? 0)} />
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900">Unique Visitor Counts (Deduplicated)</h2>
          <p className="mt-1 text-sm text-gray-600">Same visitor repeated visits on same day are ignored.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <StatCard label="Today" value={String(visitorOverview?.uniqueVisitors.today ?? 0)} />
            <StatCard label="Last 7 Days" value={String(visitorOverview?.uniqueVisitors.last7Days ?? 0)} />
            <StatCard label="Last 30 Days" value={String(visitorOverview?.uniqueVisitors.last30Days ?? 0)} />
            <StatCard label="Last 365 Days" value={String(visitorOverview?.uniqueVisitors.last365Days ?? 0)} />
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900">Manual Intraday Update Status</h2>
          <div className="mt-3 text-sm text-gray-700">
            <p>
              Date: <span className="font-semibold">{manualStatus?.predictionDate ?? "-"}</span>
            </p>
            <p>
              Status: <span className="font-semibold">{manualStatus?.status ?? "-"}</span>
            </p>
            <p>
              Updated Records:{" "}
              <span className="font-semibold">
                {manualStatus ? `${manualStatus.updatedRecordsCount}/${manualStatus.requiredRecordsCount}` : "-"}
              </span>
            </p>
            <p className="mt-1">{manualStatus?.message ?? "Status unavailable."}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Suspicious Client Detection (IP/Fingerprint)</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={trafficActorSearch}
                onChange={(e) => setTrafficActorSearch(e.target.value)}
                placeholder="Search UA/hash"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => void loadTrafficActors(trafficActorSearch)}
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700"
              >
                Search
              </button>
            </div>
          </div>
          {trafficActorsError && <p className="mt-3 text-sm font-semibold text-red-600">{trafficActorsError}</p>}
          {trafficActorsLoading && <p className="mt-3 text-sm text-gray-600">Loading suspicious traffic actors...</p>}
          {!trafficActorsLoading && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-3 py-2">Risk</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Hits</th>
                    <th className="px-3 py-2">1m Burst</th>
                    <th className="px-3 py-2">IP Hash</th>
                    <th className="px-3 py-2">Fingerprint</th>
                    <th className="px-3 py-2">Reasons</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trafficActors.map((actor) => (
                    <tr key={actor._id} className="border-b border-gray-200">
                      <td className="px-3 py-2 font-semibold uppercase">{actor.riskLevel}</td>
                      <td className="px-3 py-2">{actor.suspicionScore}</td>
                      <td className="px-3 py-2">{actor.totalHits}</td>
                      <td className="px-3 py-2">{actor.hitsLastMinute}</td>
                      <td className="px-3 py-2 font-mono text-xs">{actor.ipHash.slice(0, 14)}...</td>
                      <td className="px-3 py-2 font-mono text-xs">{actor.fingerprint.slice(0, 14)}...</td>
                      <td className="px-3 py-2">{actor.reasons?.join(", ") || "-"}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void handleToggleTrafficActorBlock(actor)}
                          className={`rounded px-3 py-1 text-xs font-semibold text-white ${actor.isBlocked ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}
                        >
                          {actor.isBlocked ? "Unblock Client" : "Block Client"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {trafficActors.length === 0 && <p className="mt-3 text-sm text-gray-600">No suspicious actors found.</p>}
            </div>
          )}

          <h3 className="mt-6 text-base font-bold text-gray-900">Active Client Blocks</h3>
          <div className="mt-3 space-y-2 text-sm">
            {blockedClients.map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="font-semibold">
                  {item.type} | {item.value.slice(0, 14)}...
                </span>
                <span>Expires: {item.expiresAt ? new Date(item.expiresAt).toLocaleString() : "Never"}</span>
              </div>
            ))}
            {blockedClients.length === 0 && <p className="text-gray-500">No active blocked clients.</p>}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900">Automatic Stock Update</h2>
          {autoUpdateError && <p className="mt-3 text-sm font-semibold text-red-600">{autoUpdateError}</p>}
          {autoUpdateResult && (
            <div className="mt-3 text-sm text-gray-700">
              <p>
                Status: <span className="font-semibold">{autoUpdateResult.status}</span>
              </p>
              <p>
                Created: <span className="font-semibold">{autoUpdateResult.createdCount}</span>
              </p>
              <p>
                Symbols: <span className="font-semibold">{autoUpdateResult.createdSymbols.join(", ") || "-"}</span>
              </p>
              <p className="mt-1">{autoUpdateResult.message}</p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900">User Traffic Insights (Last 14 Days)</h2>
          <div className="mt-4 space-y-2 text-sm">
            {(trafficInsights?.daily ?? []).slice(-10).map((item) => {
              const maxHits = Math.max(...(trafficInsights?.daily ?? []).map((x) => x.hits), 1);
              const width = Math.max((item.hits / maxHits) * 100, 4);
              return (
                <div key={item.date} className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold">{item.date}</span>
                    <span>{item.hits} hits | {item.uniqueUsers} users</span>
                  </div>
                  <div className="h-2 w-full rounded bg-gray-200">
                    <div className="h-2 rounded bg-indigo-500" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
            {!trafficInsights?.daily?.length && <p className="text-gray-500">No traffic trend data yet.</p>}
          </div>

          <h3 className="mt-6 text-base font-bold text-gray-900">Top Routes</h3>
          <div className="mt-3 space-y-2 text-sm">
            {(trafficInsights?.routes ?? []).slice(0, 8).map((item) => (
              <div key={item.route} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="font-semibold">{item.route}</span>
                <span>{item.hits} hits | {item.uniqueUsers} users</span>
              </div>
            ))}
            {!trafficInsights?.routes?.length && <p className="text-gray-500">No route activity yet.</p>}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">User Interaction Control</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name/email"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => void loadUsers(userSearch)}
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700"
              >
                Search
              </button>
            </div>
          </div>
          {usersError && <p className="mt-3 text-sm font-semibold text-red-600">{usersError}</p>}
          {usersLoading && <p className="mt-3 text-sm text-gray-600">Loading users...</p>}
          {!usersLoading && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Blocked Reason</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-200">
                      <td className="px-3 py-2 font-semibold">{user.name}</td>
                      <td className="px-3 py-2">{user.email}</td>
                      <td className="px-3 py-2">{user.role}</td>
                      <td className="px-3 py-2">
                        {user.isBlocked ? (
                          <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Blocked</span>
                        ) : (
                          <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Active</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{user.blockedReason || "-"}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void handleToggleUserBlock(user)}
                          className={`rounded px-3 py-1 text-xs font-semibold text-white ${user.isBlocked ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}
                        >
                          {user.isBlocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="mt-3 text-sm text-gray-600">No users found.</p>}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Top Symbols</h2>
            <div className="mt-4 space-y-2 text-sm">
              {(stats?.topSymbols ?? []).slice(0, 6).map((item) => (
                <div key={item.symbol} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="font-semibold">{item.symbol}</span>
                  <span>Trades: {item.trades} | PnL: {item.pnl}</span>
                </div>
              ))}
              {!stats?.topSymbols?.length && <p className="text-gray-500">No symbol stats yet.</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">PnL By Day</h2>
            <div className="mt-4 space-y-2 text-sm">
              {(stats?.pnlByDay ?? []).slice(-7).map((item) => (
                <div key={item.date} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span>{item.date}</span>
                  <span>{item.pnl}</span>
                </div>
              ))}
              {!stats?.pnlByDay?.length && <p className="text-gray-500">No pnl data yet.</p>}
            </div>
          </div>
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
