import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 bg-gray-900 py-12 text-gray-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3">
        <div>
          <h3 className="mb-4 text-xl font-bold text-white">IntradayResearch</h3>
          <p className="text-sm leading-relaxed text-gray-400">
            Personal intraday research with complete transparency.
            All results documented daily. No financial advice.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-emerald-400">Home</Link></li>
            <li><Link href="/intraday" className="hover:text-emerald-400">Intraday</Link></li>
            <li><Link href="/performance" className="hover:text-emerald-400">Performance</Link></li>
            <li><Link href="/history" className="hover:text-emerald-400">History</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-white">Disclaimer</h4>
          <p className="text-sm text-gray-400">
            This is for educational purposes only.
            Trading involves risk. Do your own research.
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} IntradayResearch. All rights reserved.
      </div>
    </footer>
  );
}

