export type TradeResult = "TARGET HIT" | "STOP LOSS" | "PARTIAL";
export type TradeSide = "BUY" | "SELL";

export type IntradayCall = {
  id: string;
  symbol: string;
  exchange: string;
  side: TradeSide;
  confidence: "HIGH" | "MEDIUM";
  postedDate?: string;
  postedAt: string;
  entry: number;
  target: number;
  stopLoss: number;
  riskReward: string;
  analysis: string[];
};

export type TradeHistoryItem = {
  id: string;
  dateISO: string;
  displayDate: string;
  closedAt?: string;
  stock: string;
  side: TradeSide;
  entry: number;
  target: number;
  stopLoss: number;
  high: number;
  low: number;
  result: TradeResult;
  returnPct: number;
  notes?: string;
  moveReason?: string;
  technicalAnalysis?: string;
  technicalPoints?: string[];
  latestNews?: string[];
  yearlyMovement?: string[];
  chartImageUrl?: string;
};

export const todayCalls: IntradayCall[] = [
  {
    id: "reliance-2026-02-12",
    symbol: "RELIANCE",
    exchange: "NSE: RELIANCE",
    side: "BUY",
    confidence: "HIGH",
    postedAt: "9:00 AM",
    entry: 2847.5,
    target: 2920,
    stopLoss: 2810,
    riskReward: "1:1.93",
    analysis: [
      "Breakout above INR 2,840 with strong participation.",
      "RSI at 62 indicates controlled bullish momentum.",
      "MACD crossover confirmed on 15-min setup.",
    ],
  },
  {
    id: "hdfcbank-2026-02-12",
    symbol: "HDFC BANK",
    exchange: "NSE: HDFCBANK",
    side: "BUY",
    confidence: "HIGH",
    postedAt: "9:12 AM",
    entry: 1645.3,
    target: 1670,
    stopLoss: 1630,
    riskReward: "1:1.61",
    analysis: [
      "Price reclaimed VWAP and held opening range low.",
      "Volume expansion near support zone.",
      "Banking index relative strength remains positive.",
    ],
  },
  {
    id: "tcs-2026-02-12",
    symbol: "TCS",
    exchange: "NSE: TCS",
    side: "SELL",
    confidence: "MEDIUM",
    postedAt: "9:22 AM",
    entry: 3882,
    target: 3825,
    stopLoss: 3912,
    riskReward: "1:1.90",
    analysis: [
      "Failed breakout at prior day high.",
      "Weak breadth in IT peers during first hour.",
      "15-min lower highs suggest intraday distribution.",
    ],
  },
];

export const tradeHistory: TradeHistoryItem[] = [
  {
    id: "reliance-2026-02-12",
    dateISO: "2026-02-12",
    displayDate: "12-Feb-26",
    stock: "RELIANCE",
    side: "BUY",
    entry: 2847.5,
    target: 2920,
    stopLoss: 2810,
    high: 2927.8,
    low: 2843.2,
    result: "TARGET HIT",
    returnPct: 2.55,
  },
  {
    id: "hdfc-2026-02-11",
    dateISO: "2026-02-11",
    displayDate: "11-Feb-26",
    stock: "HDFC BANK",
    side: "BUY",
    entry: 1645.3,
    target: 1670,
    stopLoss: 1630,
    high: 1672.4,
    low: 1642.1,
    result: "TARGET HIT",
    returnPct: 1.5,
  },
  {
    id: "tcs-2026-02-10",
    dateISO: "2026-02-10",
    displayDate: "10-Feb-26",
    stock: "TCS",
    side: "BUY",
    entry: 3850,
    target: 3910,
    stopLoss: 3820,
    high: 3875.2,
    low: 3812.5,
    result: "STOP LOSS",
    returnPct: -0.78,
  },
  {
    id: "infy-2026-02-07",
    dateISO: "2026-02-07",
    displayDate: "07-Feb-26",
    stock: "INFY",
    side: "BUY",
    entry: 1520.5,
    target: 1555,
    stopLoss: 1505,
    high: 1558.9,
    low: 1518.2,
    result: "TARGET HIT",
    returnPct: 2.27,
  },
  {
    id: "itc-2026-02-06",
    dateISO: "2026-02-06",
    displayDate: "06-Feb-26",
    stock: "ITC",
    side: "BUY",
    entry: 445.2,
    target: 452,
    stopLoss: 441,
    high: 450.8,
    low: 444.5,
    result: "PARTIAL",
    returnPct: 1.26,
  },
  {
    id: "axis-2026-02-05",
    dateISO: "2026-02-05",
    displayDate: "05-Feb-26",
    stock: "AXIS BANK",
    side: "SELL",
    entry: 1098.4,
    target: 1074,
    stopLoss: 1112,
    high: 1114.3,
    low: 1086.2,
    result: "STOP LOSS",
    returnPct: -1.24,
  },
  {
    id: "sbicard-2026-02-04",
    dateISO: "2026-02-04",
    displayDate: "04-Feb-26",
    stock: "SBI CARD",
    side: "SELL",
    entry: 756.8,
    target: 741,
    stopLoss: 766,
    high: 762.2,
    low: 744.1,
    result: "PARTIAL",
    returnPct: 0.92,
  },
];

export function formatInr(value: number) {
  return `INR ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function formatPct(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
