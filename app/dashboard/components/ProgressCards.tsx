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
    <section id="targets" className="grid gap-4 lg:grid-cols-3">
      {cards.map((card) => {
        const percentYear =
          card.target > 0
            ? clampPercent((card.yearActual / card.target) * 100)
            : 0;
        const percentMonth =
          card.monthTarget > 0
            ? clampPercent((card.monthActual / card.monthTarget) * 100)
            : 0;
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200">
                  <Icon className="h-4 w-4 text-slate-400 dark:text-slate-200" />
                  {card.title}
                </div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(card.value)}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-200">
                  / {formatCurrency(card.target)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenTargetModal(card.key)}
                className="rounded-2xl border border-slate-200/60 bg-slate-50 p-3 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
                aria-label={`Chỉnh sửa chỉ tiêu ${card.title}`}
              >
                <Icon className="h-5 w-5 text-slate-500 dark:text-slate-200" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-200">
                  <span>Tiến độ {monthLabel}</span>
                  <span>
                    {formatCurrency(card.monthActual)} /{" "}
                    {formatCurrency(card.monthTarget)}
                  </span>
                </div>
                <progress className="progress-bar" value={percentMonth} max={100} />
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-200">
                  Hoàn thành {percentMonth.toFixed(0)}%
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-200">
                  <span>Tiến độ năm</span>
                  <span>
                    {formatCurrency(card.yearActual)} /{" "}
                    {formatCurrency(card.target)}
                  </span>
                </div>
              <progress
                className="progress-bar"
                  value={percentYear}
                max={100}
              />
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-200">
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
