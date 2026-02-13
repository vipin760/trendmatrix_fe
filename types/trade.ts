export interface Trade {
  id: string;
  date: string;
  symbol: string;
  entry: number;
  target: number;
  stopLoss: number;
  actualHigh?: number;
  actualLow?: number;
  result: "TARGET" | "STOPLOSS" | "PARTIAL";
  returnPercent: number;
}
