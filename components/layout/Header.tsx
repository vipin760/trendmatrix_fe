"use client";

import Link from "next/link";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-gray-900/70">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="font-bold text-xl">IntradayResearch</div>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="/">Home</Link>
          <Link href="/intraday">Intraday</Link>
          <Link href="/performance">Performance</Link>
          <Link href="/history">History</Link>
        </nav>
        <DarkModeToggle />
      </div>
    </header>
  );
}
