"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/lib/theme";
import type { Task, TaskType } from "@/lib/dashboard/types";
import { taskTypes } from "@/lib/dashboard/types";

type TaskChartProps = {
  tasks: Task[];
};

const AXIS_TICK_LIGHT = "#64748b";
const AXIS_TICK_DARK = "#e2e8f0";
const GRID_LIGHT = "#e2e8f0";
const GRID_DARK = "#475569";

export function TaskChart({ tasks }: TaskChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickFill = isDark ? AXIS_TICK_DARK : AXIS_TICK_LIGHT;
  const gridStroke = isDark ? GRID_DARK : GRID_LIGHT;

  const chartData = taskTypes.map((label) => ({
    label: label as string,
    value: tasks.filter((task) => task.type === label).length,
  }));

  return (
    <div
      id="fees"
      className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50"
    >
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        Phân bổ công việc theo loại
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-200">
        Theo dõi nhanh khối lượng nghiệp vụ
      </p>
      <div className="mt-6 w-full" style={{ minHeight: 260, width: "100%" }}>
        <ResponsiveContainer width="100%" height={260} minHeight={260}>
          <BarChart data={chartData} margin={{ bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="label"
              tick={{
                fontSize: 12,
                angle: -45,
                textAnchor: "end",
                fill: tickFill,
              }}
              interval={0}
            />
            <YAxis allowDecimals={false} tick={{ fill: tickFill }} />
            <Tooltip
              cursor={{ fill: "rgba(15, 23, 42, 0.05)" }}
              formatter={(value) => [`${value} việc`, "Số lượng"]}
            />
            <Bar
              dataKey="value"
              fill="#1d4ed8"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
