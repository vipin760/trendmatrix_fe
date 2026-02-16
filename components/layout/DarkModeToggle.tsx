"use client";

import { useState } from "react";

function getInitialDark() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export default function DarkModeToggle() {
  const [dark, setDark] = useState(getInitialDark);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg p-2 transition hover:bg-gray-200 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      Theme
    </button>
  );
}
