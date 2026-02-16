import { authFetch } from "@/lib/client/auth-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type PredictionItem = {
  _id: string;
  symbol: string;
  market: string;
  timeframe: string;
  direction: "long" | "short";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  targets: Array<{ price: number; hit?: boolean }>;
  riskReward?: number;
  upsideReason?: string;
  reasoning?: string;
  technicalAnalysis?: string;
  technicalPoints?: string[];
  analysis?: string[] | string;
  indicators?: Array<{ name: string; value?: string; signal?: string }>;
  expiresAt?: string;
  createdAt?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  status?: string;
};

export type HistoryItem = {
  _id: string;
  predictionId?: string | PredictionItem;
  symbol: string;
  market: string;
  timeframe: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  fees?: number;
  strategyTag?: string;
  notes?: string;
  moveReason?: string;
  technicalAnalysis?: string;
  technicalPoints?: string[];
  latestNews?: string[];
  yearlyMovement?: string[];
  yearlySeries?: Array<{ date: string; close: number }>;
  yahooSymbol?: string;
  yearlyFetchedAt?: string | null;
  chartImageUrl?: string;
  openedAt: string;
  closedAt: string;
  pnlAmount?: number;
  pnlPercent?: number;
  outcome?: "win" | "loss" | "breakeven";
  createdAt?: string;
  updatedAt?: string;
};

export type AdminStats = {
  periodDays: number;
  predictions: { total: number; byStatus: Record<string, number> };
  history: {
    totalTrades: number;
    winRate: number;
    totalPnl: number;
    periodTrades: number;
    periodPnl: number;
  };
  traffic: { totalHits: number; uniqueUsers: number };
  pnlByDay: Array<{ date: string; pnl: number }>;
  topSymbols: Array<{ symbol: string; trades: number; pnl: number }>;
};

export type TrafficInsight = {
  periodDays: number;
  daily: Array<{ date: string; hits: number; uniqueUsers: number }>;
  routes: Array<{ route: string; hits: number; uniqueUsers: number; lastHitAt?: string }>;
  methods: Array<{ method: string; hits: number }>;
};

export type TrafficActor = {
  _id: string;
  date: string;
  ipHash: string;
  fingerprint: string;
  userAgent: string;
  totalHits: number;
  hitsLastMinute: number;
  suspicionScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  reasons: string[];
  isLikelyBot: boolean;
  isBlocked: boolean;
  blockedAt?: string | null;
  blockedReason?: string;
  uniqueRoutes?: string[];
  lastHitAt?: string;
};

export type BlockedClient = {
  _id: string;
  type: "ipHash" | "fingerprint";
  value: string;
  reason?: string;
  source?: "manual" | "auto";
  expiresAt?: string | null;
  createdAt?: string;
};

export type VisitorOverview = {
  asOf: string;
  uniqueVisitors: {
    today: number;
    last7Days: number;
    last30Days: number;
    last365Days: number;
  };
};

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isBlocked?: boolean;
  blockedAt?: string | null;
  blockedReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ManualIntradayUpdateStatus = {
  status: "NOT_READY" | "ALREADY_UPDATED" | "NEEDS_UPDATE";
  predictionDate: string;
  message: string;
  updatedRecordsCount: number;
  requiredRecordsCount: number;
  pendingRecordsCount?: number;
};

export type AutomaticIntradayUpdateResponse = {
  status: "SUCCESS" | "ALREADY_UPDATED" | "NOT_READY";
  predictionDate: string;
  modelPredictionDate?: string | null;
  message: string;
  createdCount: number;
  createdSymbols: string[];
  items?: PredictionItem[];
};

export type YearlyMovementPoint = {
  date: string;
  close: number;
};

export type YearlyMovementPayload = {
  symbol: string;
  yahooSymbol: string;
  points: YearlyMovementPoint[];
  movements: string[];
  fetchedAt?: string | null;
  stats: {
    startClose: number;
    lastClose: number;
    low: number;
    high: number;
    change: number;
    changePct: number;
    volatilityPct: number;
  } | null;
};

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function fetchPredictions(params?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") query.set(k, String(v));
  });
  const qs = query.toString();
  const res = await authFetch(`/api/predictions${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Unable to load predictions");
  return (await res.json()) as { items: PredictionItem[]; pagination?: Pagination };
}

export async function fetchPredictionById(id: string) {
  const res = await authFetch(`/api/predictions/${id}`);
  if (!res.ok) throw new Error("Unable to load prediction");
  return (await res.json()) as { item: PredictionItem };
}

export async function createPrediction(payload: Omit<PredictionItem, "_id">) {
  const res = await authFetch("/api/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Create prediction failed");
  return (await res.json()) as { message: string; item: PredictionItem };
}

export async function updatePrediction(id: string, payload: Partial<Omit<PredictionItem, "_id">>) {
  const res = await authFetch(`/api/predictions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Update prediction failed");
  return (await res.json()) as { message: string; item: PredictionItem };
}

export async function deletePrediction(id: string) {
  const res = await authFetch(`/api/predictions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete prediction failed");
  return (await res.json()) as { message: string };
}

export async function fetchHistory(params?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") query.set(k, String(v));
  });
  const qs = query.toString();
  const res = await authFetch(`/api/history${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Unable to load history");
  return (await res.json()) as { items: HistoryItem[]; pagination?: Pagination };
}

export async function fetchHistoryById(id: string) {
  const res = await authFetch(`/api/history/${id}`);
  if (!res.ok) throw new Error("Unable to load history item");
  return (await res.json()) as { item: HistoryItem };
}

export async function fetchHistoryYearlyMovement(id: string) {
  const res = await authFetch(`/api/history/${id}/yearly-movement`);
  if (!res.ok) throw new Error("Unable to load yearly movement");
  return (await res.json()) as YearlyMovementPayload;
}

export async function createHistory(payload: Omit<HistoryItem, "_id">) {
  const res = await authFetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Create history failed");
  return (await res.json()) as { message: string; item: HistoryItem };
}

export async function updateHistory(id: string, payload: Partial<Omit<HistoryItem, "_id">>) {
  const res = await authFetch(`/api/history/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Update history failed");
  return (await res.json()) as { message: string; item: HistoryItem };
}

export async function deleteHistory(id: string) {
  const res = await authFetch(`/api/history/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete history failed");
  return (await res.json()) as { message: string };
}

export async function fetchAdminStats(days = 30) {
  const res = await authFetch(`/api/admin/stats?days=${days}`);
  if (!res.ok) throw new Error("Unable to load admin stats");
  return (await res.json()) as AdminStats;
}

export async function fetchManualIntradayUpdateStatus() {
  const res = await authFetch("/api/admin/intraday-update-status");
  if (!res.ok) throw new Error("Unable to load manual intraday update status");
  return (await res.json()) as ManualIntradayUpdateStatus;
}

export async function triggerAutomaticIntradayUpdate() {
  const res = await authFetch("/api/admin/intraday-auto-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as { message?: string }));
    throw new Error(typeof err.message === "string" ? err.message : "Automatic intraday update failed");
  }
  return (await res.json()) as AutomaticIntradayUpdateResponse;
}

export async function fetchTrafficInsights(days = 30) {
  const res = await authFetch(`/api/admin/traffic-insights?days=${days}`);
  if (!res.ok) throw new Error("Unable to load traffic insights");
  return (await res.json()) as TrafficInsight;
}

export async function fetchAdminUsers(params?: { page?: number; limit?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await authFetch(`/api/admin/users${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Unable to load users");
  return (await res.json()) as { items: AdminUser[]; pagination: Pagination };
}

export async function setAdminUserBlocked(userId: string, blocked: boolean, reason = "") {
  const res = await authFetch(`/api/admin/users/${userId}/block`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocked, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as { message?: string }));
    throw new Error(typeof err.message === "string" ? err.message : "Unable to update user status");
  }
  return (await res.json()) as { message: string; item: AdminUser };
}

export async function fetchTrafficActors(params?: {
  page?: number;
  limit?: number;
  days?: number;
  risk?: "all" | "low" | "medium" | "high" | "critical";
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.days) query.set("days", String(params.days));
  if (params?.risk) query.set("risk", params.risk);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await authFetch(`/api/admin/traffic-actors${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Unable to load traffic actors");
  return (await res.json()) as { items: TrafficActor[]; pagination: Pagination };
}

export async function setTrafficActorBlocked(actorId: string, blocked: boolean, reason = "", durationHours = 24) {
  const res = await authFetch(`/api/admin/traffic-actors/${actorId}/block`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocked, reason, durationHours }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as { message?: string }));
    throw new Error(typeof err.message === "string" ? err.message : "Unable to update client block status");
  }
  return (await res.json()) as { message: string; item: { id: string; isBlocked: boolean; blockedAt?: string | null; blockedReason?: string } };
}

export async function fetchBlockedClients(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await authFetch(`/api/admin/blocked-clients${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Unable to load blocked clients");
  return (await res.json()) as { items: BlockedClient[]; pagination: Pagination };
}

export async function fetchVisitorOverview() {
  const res = await authFetch("/api/admin/visitor-overview");
  if (!res.ok) throw new Error("Unable to load visitor overview");
  return (await res.json()) as VisitorOverview;
}

function getVisitorId() {
  if (typeof window === "undefined") return "server";
  const key = "visitor_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const next = `v-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, next);
  return next;
}

export async function hitTraffic(route: string, method = "GET") {
  await fetch(apiUrl("/api/traffic/hit"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ route, method, visitorId: getVisitorId() }),
  }).catch(() => undefined);
}
