"use client";

import type { Task } from "@/lib/dashboard/types";
import { typeBadgeMap, typeBadgeMapDark } from "@/lib/dashboard/types";
import { formatDate } from "@/lib/dashboard/utils";

type HistoryDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  loading?: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
};

export function HistoryDrawer({
  isOpen,
  onClose,
  tasks,
  loading = false,
  onExportCsv,
  onExportPdf,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 p-4 dark:bg-black/50">
      <div className="flex h-full w-full max-w-lg flex-col rounded-2xl border border-slate-200/60 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/50">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Lịch sử công việc
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-200">
              Bao gồm công việc đã hoàn thành và đã lưu trữ (sau 7 ngày).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200/70 px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Đóng
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200/70 px-5 py-3 dark:border-slate-700">
          <button
            type="button"
            onClick={onExportCsv}
            className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Xuất CSV
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Xuất PDF
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Đang tải…
            </div>
          )}
          {!loading && tasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50 p-4 text-xs text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              Chưa có dữ liệu lịch sử.
            </div>
          )}
          {!loading && tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {task.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-200">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${typeBadgeMap[task.type]} ${typeBadgeMapDark[task.type]}`}
                    >
                      {task.type}
                    </span>
                    {task.deadline ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        Deadline: {formatDate(task.deadline)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      task.completed
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {task.completed ? "Hoàn thành" : "Đang xử lý"}
                  </span>
                  {task.archivedAt ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      Đã lưu trữ
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-200">
                {task.completedAt
                  ? `Hoàn thành: ${formatDate(task.completedAt)}`
                  : `Tạo lúc: ${formatDate(task.createdAt)}`}
                {task.archivedAt
                  ? ` · Lưu trữ: ${formatDate(task.archivedAt)}`
                  : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
