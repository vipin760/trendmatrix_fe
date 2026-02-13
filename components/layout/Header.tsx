"use client";

import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-gray-900/70">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="font-bold text-xl">IntradayResearch</div>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <a href="/">Home</a>
          <a href="/intraday">Intraday</a>
          <a href="/performance">Performance</a>
          <a href="/history">History</a>
        </nav>
        <DarkModeToggle />
      </div>
    </header>
  );
}
