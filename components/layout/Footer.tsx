export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        
        {/* Brand */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            IntradayResearch
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Personal intraday research with complete transparency.
            All results documented daily. No financial advice.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-emerald-400">Home</a></li>
            <li><a href="/intraday" className="hover:text-emerald-400">Intraday</a></li>
            <li><a href="/performance" className="hover:text-emerald-400">Performance</a></li>
            <li><a href="/history" className="hover:text-emerald-400">History</a></li>
          </ul>
        </div>

        {/* Disclaimer */}
        <div>
          <h4 className="text-white font-semibold mb-4">Disclaimer</h4>
          <p className="text-sm text-gray-400">
            This is for educational purposes only.
            Trading involves risk. Do your own research.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} IntradayResearch. All rights reserved.
      </div>
    </footer>
  );
}
