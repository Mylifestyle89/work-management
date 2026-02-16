"use client";

import { useMemo, useState } from "react";
import { Calendar, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { Task } from "@/lib/dashboard/types";
import { typeBadgeMap, typeBadgeMapDark } from "@/lib/dashboard/types";
import { formatCurrency, getDeadlineTone, formatDate } from "@/lib/dashboard/utils";

type TaskCardProps = {
  task: Task;
  isDragging?: boolean;
  onToggleCompleted: (task: Task) => void;
  onEdit: (task: Task) => void;
  onRemove: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, task: Task) => void;
};

export function TaskCard({
  task,
  isDragging,
  onToggleCompleted,
  onEdit,
  onRemove,
  onDragStart,
  onDragEnd,
  onDrop,
}: TaskCardProps) {
  const [showFinance, setShowFinance] = useState(false);

  const financeRows = useMemo(
    () => [
      { label: "Giải ngân", value: task.amountDisbursement ?? 0 },
      { label: "Phí dịch vụ", value: task.serviceFee ?? 0 },
      { label: "Thu nợ", value: task.amountRecovery ?? 0 },
      { label: "Huy động", value: task.amountMobilized ?? 0 },
    ],
    [
      task.amountDisbursement,
      task.amountMobilized,
      task.amountRecovery,
      task.serviceFee,
    ]
  );
  const hasFinanceData = financeRows.some((row) => row.value > 0);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, task)}
      className={`rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-900/50 dark:hover:border-slate-500 ${
        isDragging ? "opacity-70 ring-2 ring-blue-200 dark:ring-blue-600" : ""
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 items-start gap-3">
          <button
            type="button"
            onClick={() => onToggleCompleted(task)}
            className={`transition-all ${
              task.completed
                ? "text-emerald-500"
                : "text-slate-300 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400"
            }`}
            aria-label={
              task.completed
                ? "Đánh dấu chưa hoàn thành"
                : "Đánh dấu hoàn thành"
            }
          >
            {task.completed ? (
              <ToggleRight className="h-7 w-7" />
            ) : (
              <ToggleLeft className="h-7 w-7" />
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p
                className={`text-base font-semibold ${
                  task.completed
                    ? "text-slate-400 line-through dark:text-slate-400"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {task.title}
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-200">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${typeBadgeMap[task.type]} ${typeBadgeMapDark[task.type]}`}
              >
                {task.type}
              </span>
              {task.deadline ? (
                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${getDeadlineTone(
                    task.deadline
                  )}`}
                >
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.deadline)}
                </span>
              ) : null}
              {task.note ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  Ghi chú: {task.note}
                </span>
              ) : null}
              {hasFinanceData ? (
                <button
                  type="button"
                  onClick={() => setShowFinance((prev) => !prev)}
                  className="rounded-full border border-slate-200/70 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-all hover:shadow-sm dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {showFinance ? "Ẩn tài chính" : "Chi tiết tài chính"}
                </button>
              ) : null}
            </div>
            {showFinance ? (
              <div className="mt-2 rounded-lg border border-slate-200/60 bg-slate-50/60 px-3 py-2 text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                {financeRows.map((row) => (
                  <div
                    key={row.label}
                    className="mt-1 flex items-center justify-between gap-6 first:mt-0"
                  >
                    <span>{row.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {row.value > 0 ? formatCurrency(row.value) : "--"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 text-slate-400 dark:text-slate-200">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded-lg p-2 transition hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Sửa công việc"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(task.id)}
            className="rounded-lg p-2 transition hover:text-rose-500"
            aria-label="Xóa công việc"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
