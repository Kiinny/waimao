"use client";

import { useEffect } from "react";

export function ThemeToggle() {
  useEffect(() => {
    const enabled =
      localStorage.getItem("atlas-theme") === "dark" ||
      (!localStorage.getItem("atlas-theme") &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("atlas-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      className="icon-button focus-ring"
      aria-label="Toggle color theme"
      onClick={toggleTheme}
    >
      T
    </button>
  );
}
