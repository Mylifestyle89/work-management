"use client";

import { ListChecks } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Task } from "@/lib/dashboard/types";
import { quadrants } from "@/lib/dashboard/types";

type OverviewSectionProps = {
  tasks: Task[];
};

export function OverviewSection({ tasks }: OverviewSectionProps) {
  const chartData = quadrants.map((item) => ({
    name: item.title,
    value: tasks.filter((task) => task.quadrant === item.id).length,
  }));
  const totalTasks = chartData.reduce((sum, item) => sum + item.value, 0);
  const colors = ["#ec4899", "#10b981", "#f59e0b", "#3b82f6"];
  const legendClasses = ["bg-pink-500", "bg-emerald-500", "bg-amber-500", "bg-blue-500"];

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Tổng số công việc
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-200">
            Phân bổ theo ma trận ưu tiên
          </p>
        </div>
        <ListChecks className="h-6 w-6 text-slate-400 dark:text-slate-200" />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200/60 bg-slate-50/60 p-4 dark:border-slate-600 dark:bg-slate-700/50">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tổng số công việc
          </p>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-600 dark:text-slate-100">
            {totalTasks} việc
          </span>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} việc`, "Số lượng"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-200">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${legendClasses[index % legendClasses.length]}`}
              />
              <span>{item.name}</span>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-100">
                {item.value} việc
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
