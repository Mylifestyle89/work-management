"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

const STORAGE_KEY = "work-management-theme";

function applyThemeToDom(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  try {
    localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  } catch {
    // ignore
  }
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleClick = () => {
    const nextDark = theme !== "dark";
    // Cập nhật DOM và localStorage ngay để giao diện đổi tức thì
    applyThemeToDom(nextDark);
    toggleTheme();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={theme === "dark" ? "Bật sáng" : "Bật tối"}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
