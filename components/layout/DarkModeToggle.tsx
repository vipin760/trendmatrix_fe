"use client";

export default function DarkModeToggle() {
  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="animate-theme-pop inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white transition duration-300 hover:scale-105 hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
      title="Market theme toggle"
    >
      <span className="dark:hidden" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-600">
          <path
            d="M4 16l5-5 3 3 6-7M16 7h2v2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="hidden dark:inline" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-rose-500">
          <path
            d="M4 8l5 5 3-3 6 7M16 17h2v-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
