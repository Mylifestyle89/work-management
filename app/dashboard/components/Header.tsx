"use client";

import { Inter } from "next/font/google";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/dashboard/utils";
import { ThemeToggle } from "./ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

type HeaderProps = {
  onOpenTaskModal: () => void;
};

export function Header({ onOpenTaskModal }: HeaderProps) {
  return (
    <header
      className={`${inter.className} flex flex-wrap items-center justify-between gap-4`}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-200">
          Premium banking workspace
        </p>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Quản trị công việc tín dụng
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ThemeToggle />
        <div className="rounded-full border border-slate-200/70 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {formatDate(new Date())}
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md dark:from-blue-600 dark:to-indigo-700"
          onClick={onOpenTaskModal}
        >
          <Plus className="h-4 w-4" />
          Thêm công việc mới
        </button>
      </div>
    </header>
  );
}
