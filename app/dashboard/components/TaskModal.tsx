"use client";

import type { Quadrant, TaskType } from "@/lib/dashboard/types";
import { quadrants, taskTypes } from "@/lib/dashboard/types";
import { formatThousand, digitsOnly } from "@/lib/dashboard/utils";

export type TaskFormState = {
  title: string;
  deadline: string;
  quadrant: Quadrant;
  type: TaskType;
  note: string;
  amountDisbursement: string;
  serviceFee: string;
  amountRecovery: string;
  amountMobilized: string;
};

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  form: TaskFormState;
  onChange: (updates: Partial<TaskFormState>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  taskCount: number;
  editingTaskId: string | null;
};

export function TaskModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  taskCount,
  editingTaskId,
}: TaskModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/50">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Tạo công việc mới
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-200">
              Lưu tự động trong localStorage cho demo
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

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label
              htmlFor="task-title"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
            >
              Tên khách hàng
            </label>
            <input
              id="task-title"
              className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={form.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </div>

          <div>
            <label
              htmlFor="task-deadline"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
            >
              Deadline hoàn thành
            </label>
            <input
              id="task-deadline"
              type="date"
              className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={form.deadline}
              onChange={(e) => onChange({ deadline: e.target.value })}
            />
          </div>

          <div>
            <label
              htmlFor="task-quadrant"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
            >
              Ma trận ưu tiên
            </label>
            <select
              id="task-quadrant"
              className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={form.quadrant}
              onChange={(e) =>
                onChange({ quadrant: e.target.value as Quadrant })
              }
            >
              {quadrants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="task-type"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
            >
              Loại nghiệp vụ
            </label>
            <select
              id="task-type"
              className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={form.type}
              onChange={(e) => onChange({ type: e.target.value as TaskType })}
            >
              {taskTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {form.type === "Giải ngân" && (
            <>
              <div>
                <label
                  htmlFor="amount-disbursement"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
                >
                  Số tiền giải ngân
                </label>
                <input
                  id="amount-disbursement"
                  type="text"
                  inputMode="numeric"
                  className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={formatThousand(form.amountDisbursement)}
                  onChange={(e) =>
                    onChange({ amountDisbursement: digitsOnly(e.target.value) })
                  }
                  placeholder="Ví dụ: 500.000.000"
                />
              </div>
              <div>
                <label
                  htmlFor="service-fee"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
                >
                  Phí dịch vụ
                </label>
                <input
                  id="service-fee"
                  type="text"
                  inputMode="numeric"
                  className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={formatThousand(form.serviceFee)}
                  onChange={(e) => onChange({ serviceFee: digitsOnly(e.target.value) })}
                  placeholder="Ví dụ: 3.000.000"
                />
              </div>
            </>
          )}

          {form.type === "Thu nợ" && (
            <div>
              <label
                htmlFor="amount-recovery"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
              >
                Số tiền thu hồi
              </label>
              <input
                id="amount-recovery"
                type="text"
                inputMode="numeric"
                className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={formatThousand(form.amountRecovery)}
                onChange={(e) => onChange({ amountRecovery: digitsOnly(e.target.value) })}
                placeholder="Ví dụ: 200.000.000"
              />
            </div>
          )}

          {form.type === "Huy động vốn" && (
            <div>
              <label
                htmlFor="amount-mobilized"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
              >
                Số tiền huy động
              </label>
              <input
                id="amount-mobilized"
                type="text"
                inputMode="numeric"
                className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={formatThousand(form.amountMobilized)}
                onChange={(e) =>
                  onChange({ amountMobilized: digitsOnly(e.target.value) })
                }
                placeholder="Ví dụ: 150.000.000"
              />
            </div>
          )}

          {form.type === "Khác" && (
            <div className="md:col-span-2">
              <label
                htmlFor="task-note"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
              >
                Ghi chú loại công việc
              </label>
              <input
                id="task-note"
                className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={form.note}
                onChange={(e) => onChange({ note: e.target.value })}
                placeholder="Ví dụ: Gia hạn hợp đồng, tái thẩm định..."
              />
            </div>
          )}

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md dark:from-blue-600 dark:to-indigo-700"
            >
              {editingTaskId ? "Lưu thay đổi" : "Thêm công việc"}
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-200">
              Tổng công việc hiện có: {taskCount}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
