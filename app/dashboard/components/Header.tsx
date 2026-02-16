"use client";

import { Inter } from "next/font/google";
import { History } from "lucide-react";
import { formatDate } from "@/lib/dashboard/utils";
import { ThemeToggle } from "./ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

type HeaderProps = {
  onOpenHistory: () => void;
};

export function Header({ onOpenHistory }: HeaderProps) {
  return (
    <header
      className={`${inter.className} flex flex-wrap items-center justify-between gap-3`}
    >
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Quản trị công việc tín dụng
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
          {formatDate(new Date())}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={onOpenHistory}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:hidden"
        >
          <History className="h-4 w-4" />
          Lịch sử công việc
        </button>
      </div>
    </header>
  );
}
