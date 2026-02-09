"use client";

import { ListChecks } from "lucide-react";
import type { Task } from "@/lib/dashboard/types";
import { quadrants } from "@/lib/dashboard/types";

type OverviewSectionProps = {
  tasks: Task[];
};

export function OverviewSection({ tasks }: OverviewSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Tổng hợp trạng thái công việc
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-200">
            Theo dõi nhanh phân bổ ưu tiên theo ma trận
          </p>
        </div>
        <ListChecks className="h-6 w-6 text-slate-400 dark:text-slate-200" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {quadrants.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200/60 bg-slate-50/60 p-4 dark:border-slate-600 dark:bg-slate-700/50"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {item.title}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.badge} ${item.darkBadge ?? ""}`}
              >
                {tasks.filter((task) => task.quadrant === item.id).length} việc
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-200">
              {item.subtitle}
            </p>
          </div>
        ))}
        <div className="md:col-span-2 text-xs text-slate-400 dark:text-slate-200">
          Tổng công việc hiện có: {tasks.length}
        </div>
      </div>
    </div>
  );
}
