"use client";

import { BadgeDollarSign, Banknote, Target } from "lucide-react";
import type { TargetKey } from "@/lib/dashboard/types";
import { formatCurrency, clampPercent } from "@/lib/dashboard/utils";

type ProgressCardItem = {
  key: TargetKey;
  title: string;
  icon: typeof Banknote;
  value: number;
  target: number;
  monthActual: number;
  monthTarget: number;
  yearActual: number;
  /** Chỉ dùng cho thẻ Dư nợ thuần */
  outstandingStartOfDay?: number;
  outstandingStartOfMonth?: number;
  outstandingStartOfYear?: number;
};

type ProgressCardsProps = {
  cards: ProgressCardItem[];
  monthLabel: string;
  onOpenTargetModal: (key: TargetKey) => void;
};

export function ProgressCards({
  cards,
  monthLabel,
  onOpenTargetModal,
}: ProgressCardsProps) {
  return (
    <section
      id="targets"
      className="grid gap-4 grid-cols-1 lg:grid-cols-[1.55fr_0.72fr_0.72fr]"
    >
      {cards.map((card) => {
        const isCompact = card.key === "mobilized" || card.key === "serviceFee";
        const isOutstanding = card.key === "outstanding";
        const startOfDay = card.outstandingStartOfDay ?? 0;
        const startOfMonth = card.outstandingStartOfMonth ?? 0;
        const startOfYear = card.outstandingStartOfYear ?? 0;
        const monthDelta =
          card.monthTarget != null ? card.monthTarget - startOfDay : 0;
        const yearDelta =
          card.target != null ? card.target - startOfYear : 0;
        const percentMonth =
          isOutstanding && monthDelta > 0
            ? clampPercent((card.monthActual / monthDelta) * 100)
            : !isOutstanding && card.monthTarget > 0
              ? clampPercent((card.monthActual / card.monthTarget) * 100)
              : 0;
        const yearNumeratorOutstanding = startOfDay - startOfYear;
        const percentYear =
          isOutstanding && yearDelta > 0
            ? clampPercent((yearNumeratorOutstanding / yearDelta) * 100)
            : !isOutstanding && card.target > 0
              ? clampPercent((card.yearActual / card.target) * 100)
              : 0;
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50 ${isCompact ? "p-3" : "p-5"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className={`flex items-center gap-1.5 font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-200 ${isCompact ? "text-[10px]" : "gap-2 text-xs tracking-[0.2em]"}`}>
                  <Icon className={`shrink-0 text-slate-400 dark:text-slate-200 ${isCompact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
                  <span className="truncate">{card.title}</span>
                </div>
                <p className={`font-semibold tabular-nums text-slate-900 dark:text-slate-100 ${isCompact ? "text-base" : "text-2xl"}`}>
                  {formatCurrency(card.value)}
                </p>
                {!isOutstanding && (
                  <p
                    className={`text-slate-400 dark:text-slate-200 ${
                      isCompact ? "text-[10px]" : "text-xs"
                    }`}
                  >
                    / {formatCurrency(card.target)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onOpenTargetModal(card.key)}
                className={`shrink-0 rounded-xl border border-slate-200/60 bg-slate-50 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 ${isCompact ? "p-2" : "rounded-2xl p-3"}`}
                aria-label={`Chỉnh sửa chỉ tiêu ${card.title}`}
              >
                <Icon className={`text-slate-500 dark:text-slate-200 ${isCompact ? "h-4 w-4" : "h-5 w-5"}`} />
              </button>
            </div>
            {card.key === "outstanding" && (
              <div className="mt-4 rounded-xl border border-slate-200/60 bg-slate-50/80 p-3 dark:border-slate-600 dark:bg-slate-800/80">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-300">
                  Chỉ tiêu dư nợ
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 dark:text-slate-400">
                      Dư nợ đầu ngày
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {formatCurrency(card.outstandingStartOfDay ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 dark:text-slate-400">
                      Dư nợ đầu tháng
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {formatCurrency(card.outstandingStartOfMonth ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 dark:text-slate-400">
                      Dư nợ đầu năm
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {formatCurrency(card.outstandingStartOfYear ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className={`space-y-3 ${isCompact ? "mt-2" : "mt-4"}`}>
              <div>
                <div className={`flex items-center justify-between text-slate-500 dark:text-slate-200 ${isCompact ? "text-[10px]" : "text-xs"}`}>
                  <span>Tiến độ {monthLabel}</span>
                  <span className="tabular-nums">
                    {isOutstanding
                      ? `${formatCurrency(card.monthActual)} / ${formatCurrency(monthDelta)}`
                      : `${formatCurrency(card.monthActual)} / ${formatCurrency(card.monthTarget)}`}
                  </span>
                </div>
                <progress className="progress-bar" value={percentMonth} max={100} />
                <p className={`mt-0.5 text-slate-400 dark:text-slate-200 ${isCompact ? "text-[10px]" : "text-[11px]"}`}>
                  Hoàn thành {percentMonth.toFixed(0)}%
                </p>
              </div>
              <div>
                <div className={`flex items-center justify-between text-slate-500 dark:text-slate-200 ${isCompact ? "text-[10px]" : "text-xs"}`}>
                  <span>Tiến độ năm</span>
                  <span className="tabular-nums">
                    {isOutstanding
                      ? `${formatCurrency(yearNumeratorOutstanding)} / ${formatCurrency(yearDelta)}`
                      : `${formatCurrency(card.yearActual)} / ${formatCurrency(card.target)}`}
                  </span>
                </div>
                <progress
                  className="progress-bar"
                  value={percentYear}
                  max={100}
                />
                <p className={`mt-0.5 text-slate-400 dark:text-slate-200 ${isCompact ? "text-[10px]" : "text-[11px]"}`}>
                  Hoàn thành {percentYear.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
