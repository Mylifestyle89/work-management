"use client";

import { CirclePlus, History } from "lucide-react";

type SidebarProps = {
  onOpenTaskModal: () => void;
  onOpenHistory: () => void;
};

export function Sidebar({ onOpenTaskModal, onOpenHistory }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center border-r border-slate-200/70 bg-white py-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:flex">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-300">
        Menu
      </p>
      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onOpenTaskModal}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm transition-all hover:shadow-md dark:from-blue-600 dark:to-indigo-700"
          aria-label="Thêm công việc mới"
          title="Thêm công việc mới"
        >
          <CirclePlus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/70 bg-slate-50 text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label="Lịch sử công việc"
          title="Lịch sử công việc"
        >
          <History className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-auto text-[11px] uppercase tracking-[0.3em] text-slate-300 dark:text-slate-400">
        Ops
      </div>
    </aside>
  );
}
