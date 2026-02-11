"use client";

import {
  BadgeDollarSign,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  LayoutDashboard,
  ListChecks,
  Target,
  TimerOff,
  ListTodo,
} from "lucide-react";

const navItems = [
  { label: "Tổng quan", icon: LayoutDashboard, href: "#overview" },
  { label: "Công việc", icon: ListChecks, href: "#tasks" },
  { label: "Chỉ tiêu", icon: Target, href: "#targets" },
  { label: "Phí dịch vụ", icon: BadgeDollarSign, href: "#fees" },
];

type FilterKey =
  | "all"
  | "today"
  | "thisWeek"
  | "overdue"
  | "completed"
  | "pending";

const filterItems: Array<{
  key: FilterKey;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "all", label: "Tất cả", icon: ListTodo },
  { key: "today", label: "Hôm nay", icon: CalendarDays },
  { key: "thisWeek", label: "Tuần này", icon: CalendarRange },
  { key: "overdue", label: "Quá hạn", icon: TimerOff },
  { key: "completed", label: "Hoàn thành", icon: CheckCircle2 },
  { key: "pending", label: "Đang xử lý", icon: ListChecks },
];

type SidebarProps = {
  activeFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
};

export function Sidebar({ activeFilter, onFilterChange }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-20 flex-col items-center gap-6 border-r border-slate-200/70 bg-white py-8 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:flex">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900">
        <LayoutDashboard className="h-5 w-5" />
      </div>
      <div className="flex flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent bg-slate-50 text-slate-500 transition-all hover:border-slate-200/70 hover:bg-white hover:text-slate-900 hover:shadow-sm dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <Icon className="h-5 w-5" />
            </a>
          );
        })}
      </div>
      <div className="w-full px-3">
        <div className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300 dark:text-slate-400">
          Filter
        </div>
        <div className="mt-3 flex flex-col items-center gap-2">
          {filterItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onFilterChange(item.key)}
                aria-label={`Lọc ${item.label}`}
                title={item.label}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                  isActive
                    ? "border-blue-200/70 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-600/60 dark:bg-blue-900/30 dark:text-blue-200"
                    : "border-transparent bg-slate-50 text-slate-500 hover:border-slate-200/70 hover:bg-white hover:text-slate-900 hover:shadow-sm dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-auto text-[11px] uppercase tracking-[0.3em] text-slate-300 dark:text-slate-400">
        Ops
      </div>
    </aside>
  );
}
