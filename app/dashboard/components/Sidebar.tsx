"use client";

import { Plus, History, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";

type SidebarProps = {
  onOpenTaskModal: () => void;
  onOpenHistory: () => void;
};

export function Sidebar({ onOpenTaskModal, onOpenHistory }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200/70 bg-white py-6 text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:flex ${
        isExpanded ? "w-72 px-4" : "w-20 items-center px-3"
      }`}
    >
      <div className={`flex items-center ${isExpanded ? "justify-between" : "justify-center"}`}>
        {isExpanded ? (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-300">
            Menu
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/70 bg-slate-50 text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label={isExpanded ? "Thu gọn menu" : "Mở rộng menu"}
          title={isExpanded ? "Thu gọn menu" : "Mở rộng menu"}
        >
          {isExpanded ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </button>
      </div>

      {isExpanded ? (
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onOpenTaskModal}
            className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md dark:from-blue-600 dark:to-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Thêm công việc mới
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <History className="h-4 w-4" />
            Lịch sử công việc
          </button>
        </div>
      ) : (
        <div className="mt-6 text-[10px] uppercase tracking-[0.3em] text-slate-300 dark:text-slate-400">
          Menu
        </div>
      )}

      <div className="mt-auto text-[11px] uppercase tracking-[0.3em] text-slate-300 dark:text-slate-400">
        Ops
      </div>
    </aside>
  );
}
