import { BellRing, AlertTriangle, CalendarClock } from "lucide-react";
import type { Task } from "@/lib/dashboard/types";
import { formatCurrency, formatDate } from "@/lib/dashboard/utils";

type ReminderItem = {
  id: string;
  title: string;
  type: Task["type"];
  deadline: string;
  score: number;
  reason: string;
  amount: number;
};

type ReminderSectionProps = {
  items: ReminderItem[];
};

const getTone = (score: number) => {
  if (score >= 70) return "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
  if (score >= 40) return "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
};

export function ReminderSection({ items }: ReminderSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Nhắc việc hôm nay
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-200">
            Ưu tiên theo hạn và giá trị nghiệp vụ
          </p>
        </div>
        <BellRing className="h-6 w-6 text-slate-400 dark:text-slate-200" />
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200/70 bg-slate-50 p-4 text-xs text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
          Chưa có nhắc việc cần xử lý.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200/60 bg-slate-50/60 p-4 dark:border-slate-600 dark:bg-slate-700/50"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {item.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-200">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      <CalendarClock className="h-3 w-3" />
                      {formatDate(item.deadline)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {item.type}
                    </span>
                    {item.amount > 0 && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {formatCurrency(item.amount)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getTone(item.score)}`}>
                  {item.reason}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                Điểm ưu tiên: {item.score}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
