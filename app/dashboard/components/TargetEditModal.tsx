import type { TargetKey } from "@/lib/dashboard/types";
import { formatThousand, digitsOnly } from "@/lib/dashboard/utils";

type TargetEditFormState = {
  monthlyTarget: string;
  annualTarget: string;
  /** Chỉ dùng khi targetKey === "outstanding" */
  startOfDay: string;
  startOfMonth: string;
  startOfYear: string;
};

type TargetEditModalProps = {
  isOpen: boolean;
  title: string;
  monthlyTarget: number;
  annualTarget: number;
  form: TargetEditFormState;
  onChange: (updates: Partial<TargetEditFormState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  targetKey: TargetKey | null;
  /** Chỉ dùng khi targetKey === "outstanding" */
  outstandingStartOfDay?: number;
  outstandingStartOfMonth?: number;
  outstandingStartOfYear?: number;
};

export function TargetEditModal({
  isOpen,
  title,
  monthlyTarget,
  annualTarget,
  form,
  onChange,
  onClose,
  onSubmit,
  targetKey,
  outstandingStartOfDay = 0,
  outstandingStartOfMonth = 0,
  outstandingStartOfYear = 0,
}: TargetEditModalProps) {
  if (!isOpen || !targetKey) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/50">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Cập nhật chỉ tiêu {title.toLowerCase()}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-200">
              Để trống nếu muốn giữ nguyên giá trị trước đó
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

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          {targetKey === "outstanding" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="outstanding-start-day"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
                  >
                    Dư nợ đầu ngày
                  </label>
                  <input
                    id="outstanding-start-day"
                    type="text"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={formatThousand(form.startOfDay)}
                    placeholder={formatThousand(outstandingStartOfDay)}
                    onChange={(e) => onChange({ startOfDay: digitsOnly(e.target.value) })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="outstanding-start-month"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
                  >
                    Dư nợ đầu tháng
                  </label>
                  <input
                    id="outstanding-start-month"
                    type="text"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={formatThousand(form.startOfMonth)}
                    placeholder={formatThousand(outstandingStartOfMonth)}
                    onChange={(e) => onChange({ startOfMonth: digitsOnly(e.target.value) })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="outstanding-start-year"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
                  >
                    Dư nợ đầu năm
                  </label>
                  <input
                    id="outstanding-start-year"
                    type="text"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={formatThousand(form.startOfYear)}
                    placeholder={formatThousand(outstandingStartOfYear)}
                    onChange={(e) => onChange({ startOfYear: digitsOnly(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="monthly-target"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
                >
                  Mục tiêu tháng
                </label>
                <input
                  id="monthly-target"
                  type="text"
                  inputMode="numeric"
                  className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={formatThousand(form.monthlyTarget)}
                  placeholder={formatThousand(monthlyTarget)}
                  onChange={(e) => onChange({ monthlyTarget: digitsOnly(e.target.value) })}
                />
              </div>
            </>
          )}
          {targetKey !== "outstanding" && (
            <div>
              <label
                htmlFor="monthly-target-other"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
              >
                Chỉ tiêu tháng
              </label>
              <input
                id="monthly-target-other"
                type="text"
                inputMode="numeric"
                className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={formatThousand(form.monthlyTarget)}
                placeholder={formatThousand(monthlyTarget)}
                onChange={(e) => onChange({ monthlyTarget: digitsOnly(e.target.value) })}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="annual-target"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200"
            >
              Mục tiêu năm
            </label>
            <input
              id="annual-target"
              type="text"
              inputMode="numeric"
              className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={formatThousand(form.annualTarget)}
              placeholder={formatThousand(annualTarget)}
              onChange={(e) => onChange({ annualTarget: digitsOnly(e.target.value) })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md dark:from-blue-600 dark:to-indigo-700"
            >
              Lưu chỉ tiêu
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-200">
              Nhập giá trị mới để cập nhật.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
