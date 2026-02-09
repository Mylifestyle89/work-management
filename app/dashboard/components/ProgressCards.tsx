"use client";

import { BadgeDollarSign, Banknote, Target } from "lucide-react";
import type { TargetKey, TargetValues } from "@/lib/dashboard/types";
import { formatCurrency, clampPercent } from "@/lib/dashboard/utils";

type ProgressCardItem = {
  key: TargetKey;
  title: string;
  icon: typeof Banknote;
  value: number;
  target: number;
};

type ProgressCardsProps = {
  cards: ProgressCardItem[];
  editingTarget: TargetKey | null;
  onEditingTargetChange: (key: TargetKey | null) => void;
  targetValues: TargetValues;
  onTargetValuesChange: (values: TargetValues) => void;
};

export function ProgressCards({
  cards,
  editingTarget,
  onEditingTargetChange,
  targetValues,
  onTargetValuesChange,
}: ProgressCardsProps) {
  return (
    <section id="targets" className="grid gap-4 lg:grid-cols-3">
      {cards.map((card) => {
        const percent = clampPercent((card.value / card.target) * 100);
        const isEditing = editingTarget === card.key;
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
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      aria-label={`Chỉ tiêu ${card.title}`}
                      className="h-9 w-full rounded-lg border border-slate-200/70 px-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      value={card.target}
                      onChange={(event) =>
                        onTargetValuesChange({
                          ...targetValues,
                          [card.key]: Number(event.target.value) || 0,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => onEditingTargetChange(null)}
                      className="rounded-lg border border-slate-200/70 px-3 py-2 text-[11px] font-semibold text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:text-slate-200"
                    >
                      Xong
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-200">
                    / {formatCurrency(card.target)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  onEditingTargetChange(
                    editingTarget === card.key ? null : card.key
                  )
                }
                className="rounded-2xl border border-slate-200/60 bg-slate-50 p-3 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
                aria-label={`Chỉnh sửa ${card.title}`}
              >
                <Icon className="h-5 w-5 text-slate-500 dark:text-slate-200" />
              </button>
            </div>
            <div className="mt-4">
              <progress
                className="progress-bar"
                value={percent}
                max={100}
              />
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-200">
                Hoàn thành {percent.toFixed(0)}%
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
