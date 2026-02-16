export default function SelectionFramework() {
  return (
    <section className="animate-fade-up mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
        Our Intraday Stock Selection Framework
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        Every stock published on this platform follows a structured, rule-based validation model. No random entries.
        No emotional trades. No hindsight adjustments.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        Our process is built around liquidity, structure, and risk control.
      </p>

      <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">1. Market Direction First</h3>
          <p>
            Before selecting any stock, we analyze overall market bias: NIFTY 1-hour trend structure, VWAP
            positioning, sector strength and rotation, and volatility conditions. If the broader market does not
            support continuation, we avoid aggressive setups.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">2. Liquidity and Volume Filter</h3>
          <p>
            We only consider stocks that meet strict liquidity standards: average daily volume above 1M shares,
            relative volume expansion (at least 1.5x recent average), clean intraday order flow. Low-volume or
            operator-driven stocks are rejected.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">3. Technical Confirmation Rules</h3>
          <p>
            A stock must satisfy technical conditions before being selected: price trading above VWAP and 20 EMA, RSI
            between 55 and 70, MACD crossover or expanding histogram, breakout from previous day high or volatility
            compression. If any major condition fails, the setup is discarded.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">4. Defined Risk Structure</h3>
          <p>
            Every setup must maintain a minimum 1:2 risk-reward ratio, have a clearly defined structural stop-loss,
            and fit within capital risk limits. If risk cannot be controlled, the trade is not taken.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">5. Transparency and Accountability</h3>
          <p>
            All outcomes, profit or loss, are documented in the performance section. No deletions, no edits, and no
            cherry-picking. Consistency and discipline matter more than individual trade outcomes.
          </p>
        </div>
      </div>
    </section>
  );
}
