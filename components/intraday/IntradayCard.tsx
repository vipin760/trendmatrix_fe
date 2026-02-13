import { Trade } from "@/types/trade";


export default function IntradayCard({ trade }: { trade: Trade }) {
  return (
    <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-lg">
      <h3 className="text-3xl font-bold">{trade.symbol}</h3>

      <div className="mt-6 space-y-3">
        <div>Entry: ₹{trade.entry}</div>
        <div>Target: ₹{trade.target}</div>
        <div>Stop Loss: ₹{trade.stopLoss}</div>
      </div>
    </div>
  );
}
