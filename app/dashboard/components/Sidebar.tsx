"use client";

import {
  BadgeDollarSign,
  LayoutDashboard,
  ListChecks,
  Target,
} from "lucide-react";

const navItems = [
  { label: "Tổng quan", icon: LayoutDashboard, href: "#overview" },
  { label: "Công việc", icon: ListChecks, href: "#tasks" },
  { label: "Chỉ tiêu", icon: Target, href: "#targets" },
  { label: "Phí dịch vụ", icon: BadgeDollarSign, href: "#fees" },
];

export function Sidebar() {
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
      <div className="mt-auto text-[11px] uppercase tracking-[0.3em] text-slate-300 dark:text-slate-400">
        Ops
      </div>
    </aside>
  );
}
