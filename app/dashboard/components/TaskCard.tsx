"use client";

import { Calendar, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { Task } from "@/lib/dashboard/types";
import { typeBadgeMap, typeBadgeMapDark } from "@/lib/dashboard/types";
import { formatCurrency, formatDate, getDeadlineTone } from "@/lib/dashboard/utils";

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
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, task)}
      className={`rounded-xl border border-slate-200/50 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-900/50 dark:hover:border-indigo-600 ${
        isDragging ? "opacity-70 ring-2 ring-blue-200 dark:ring-blue-600" : ""
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-start gap-4">
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
              <ToggleRight className="h-8 w-8" />
            ) : (
              <ToggleLeft className="h-8 w-8" />
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p
                className={`text-lg font-semibold ${
                  task.completed
                    ? "text-slate-400 line-through dark:text-slate-400"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {task.title}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-200">
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
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 lg:justify-end">
          <div className="rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
            <div className="flex items-center justify-between gap-6">
              <span>Giải ngân</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {task.amountDisbursement
                  ? formatCurrency(task.amountDisbursement)
                  : "--"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-6">
              <span>Phí dịch vụ</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {task.serviceFee
                  ? formatCurrency(task.serviceFee)
                  : "--"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-6">
              <span>Thu nợ</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {task.amountRecovery
                  ? formatCurrency(task.amountRecovery)
                  : "--"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-6">
              <span>Huy động</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {task.amountMobilized
                  ? formatCurrency(task.amountMobilized)
                  : "--"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-200">
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
    </div>
  );
}
