"use client";

import { useState } from "react";
import type { Task } from "@/lib/dashboard/types";
import { typeBadgeMap, typeBadgeMapDark } from "@/lib/dashboard/types";
import { formatDate, formatCurrency } from "@/lib/dashboard/utils";

type HistoryDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  loading?: boolean;
  onExportExcel: () => void;
  onExportPdf: () => void;
};

type ViewMode = "cards" | "table";

export function HistoryDrawer({
  isOpen,
  onClose,
  tasks,
  loading = false,
  onExportExcel,
  onExportPdf,
}: HistoryDrawerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 p-4 dark:bg-black/50">
      <div className="flex h-full w-full max-w-4xl flex-col rounded-2xl border border-slate-200/60 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/50">
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

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/70 px-5 py-3 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
              viewMode === "table"
                ? "border-slate-400 bg-slate-100 text-slate-800 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                : "border-slate-200/70 bg-white text-slate-600 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Xem dạng bảng
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
              viewMode === "cards"
                ? "border-slate-400 bg-slate-100 text-slate-800 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                : "border-slate-200/70 bg-white text-slate-600 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Xem dạng thẻ
          </button>
          <span className="mx-1 text-slate-300 dark:text-slate-600">|</span>
          <button
            type="button"
            onClick={onExportExcel}
            className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Xuất Excel
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Xuất PDF
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loading && (
            <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 mx-5 mt-4">
              Đang tải…
            </div>
          )}
          {!loading && tasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50 p-4 text-xs text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 mx-5 mt-4">
              Chưa có dữ liệu lịch sử.
            </div>
          )}
          {!loading && viewMode === "cards" && tasks.length > 0 && (
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {tasks.map((task) => (
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
          )}
          {!loading && viewMode === "table" && tasks.length > 0 && (
            <div className="flex-1 overflow-auto px-4 py-4 min-h-0">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Tiêu đề
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Ô
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Loại
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Ghi chú
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Hạn
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Giải ngân
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Phí DV
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Thu nợ
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Huy động
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Hoàn thành
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Lưu trữ
                    </th>
                    <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 whitespace-nowrap">
                      Tạo lúc
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80"
                    >
                      <td className="border border-slate-200 px-3 py-2 text-slate-800 dark:border-slate-600 dark:text-slate-200 max-w-[200px] truncate" title={task.title}>
                        {task.title}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {task.quadrant}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {task.type}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 max-w-[120px] truncate" title={task.note ?? ""}>
                        {task.note ?? "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {task.deadline ? formatDate(task.deadline) : "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                        {task.amountDisbursement != null ? formatCurrency(task.amountDisbursement) : "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                        {task.serviceFee != null ? formatCurrency(task.serviceFee) : "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                        {task.amountRecovery != null ? formatCurrency(task.amountRecovery) : "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                        {task.amountMobilized != null ? formatCurrency(task.amountMobilized) : "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {task.completed ? "Hoàn thành" : "Đang xử lý"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {task.completedAt ? formatDate(task.completedAt) : "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {task.archivedAt ? formatDate(task.archivedAt) : "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(task.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
