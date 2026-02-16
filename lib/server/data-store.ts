import { promises as fs } from "node:fs";
import path from "node:path";
import { todayCalls as fallbackCalls, tradeHistory as fallbackHistory, type IntradayCall, type TradeHistoryItem } from "@/lib/trades";

type TrafficData = {
  totalHits: number;
  perPage: Record<string, number>;
  daily: Record<string, number>;
  lastUpdated: string;
};

type TradingData = {
  todayCalls: IntradayCall[];
  tradeHistory: TradeHistoryItem[];
  traffic: TrafficData;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "trading-data.json");

const defaultData: TradingData = {
  todayCalls: fallbackCalls,
  tradeHistory: fallbackHistory,
  traffic: { totalHits: 0, perPage: {}, daily: {}, lastUpdated: "" },
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(DATA_FILE); } catch { await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), "utf8"); }
}

export async function readTradingData(): Promise<TradingData> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const sanitized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const parsed = JSON.parse(sanitized) as Partial<TradingData>;
  return {
    todayCalls: parsed.todayCalls ?? [],
    tradeHistory: parsed.tradeHistory ?? [],
    traffic: {
      totalHits: parsed.traffic?.totalHits ?? 0,
      perPage: parsed.traffic?.perPage ?? {},
      daily: parsed.traffic?.daily ?? {},
      lastUpdated: parsed.traffic?.lastUpdated ?? "",
    },
  };
}

export async function writeTradingData(nextData: TradingData) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(nextData, null, 2), "utf8");
}

export async function trackTrafficHit(page: string) {
  const normalizedPage = page.startsWith("/") ? page : `/${page}`;
  const data = await readTradingData();
  const todayKey = new Date().toISOString().slice(0, 10);

  data.traffic.totalHits += 1;
  data.traffic.perPage[normalizedPage] = (data.traffic.perPage[normalizedPage] ?? 0) + 1;
  data.traffic.daily[todayKey] = (data.traffic.daily[todayKey] ?? 0) + 1;
  data.traffic.lastUpdated = new Date().toISOString();

  await writeTradingData(data);
  return data.traffic;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createPrediction(item: Omit<IntradayCall, "id">) {
  const data = await readTradingData();
  const next = { ...item, id: createId(item.symbol.toLowerCase().replace(/\s+/g, "-")) };
  data.todayCalls.unshift(next);
  await writeTradingData(data);
  return next;
}

export async function updatePrediction(id: string, item: Omit<IntradayCall, "id">) {
  const data = await readTradingData();
  const idx = data.todayCalls.findIndex((entry) => entry.id === id);
  if (idx < 0) return null;
  data.todayCalls[idx] = { ...item, id };
  await writeTradingData(data);
  return data.todayCalls[idx];
}

export async function deletePrediction(id: string) {
  const data = await readTradingData();
  const nextList = data.todayCalls.filter((entry) => entry.id !== id);
  if (nextList.length === data.todayCalls.length) return false;
  data.todayCalls = nextList;
  await writeTradingData(data);
  return true;
}

export async function createHistory(item: Omit<TradeHistoryItem, "id">) {
  const data = await readTradingData();
  const next = { ...item, id: createId(item.stock.toLowerCase().replace(/\s+/g, "-")) };
  data.tradeHistory.unshift(next);
  await writeTradingData(data);
  return next;
}

export async function updateHistory(id: string, item: Omit<TradeHistoryItem, "id">) {
  const data = await readTradingData();
  const idx = data.tradeHistory.findIndex((entry) => entry.id === id);
  if (idx < 0) return null;
  data.tradeHistory[idx] = { ...item, id };
  await writeTradingData(data);
  return data.tradeHistory[idx];
}

export async function deleteHistory(id: string) {
  const data = await readTradingData();
  const nextList = data.tradeHistory.filter((entry) => entry.id !== id);
  if (nextList.length === data.tradeHistory.length) return false;
  data.tradeHistory = nextList;
  await writeTradingData(data);
  return true;
}
