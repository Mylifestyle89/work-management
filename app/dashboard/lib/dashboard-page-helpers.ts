import type { Task } from "@/lib/dashboard/types";

export type DashboardTotals = {
  totalDisbursement: number;
  totalRecovery: number;
  totalMobilized: number;
  totalServiceFee: number;
  netOutstanding: number;
};

export type TasksResponse = {
  tasks: Task[];
  totals: DashboardTotals;
};

export const initialTargetFormState = {
  monthlyTarget: "",
  annualTarget: "",
  startOfDay: "",
  startOfMonth: "",
  startOfYear: "",
};

export const summarizeTotals = (items: Task[]): DashboardTotals => {
  const totalDisbursement = items.reduce(
    (sum, task) => sum + (task.amountDisbursement ?? 0),
    0
  );
  const totalRecovery = items.reduce(
    (sum, task) => sum + (task.amountRecovery ?? 0),
    0
  );
  const totalMobilized = items.reduce(
    (sum, task) => sum + (task.amountMobilized ?? 0),
    0
  );
  const totalServiceFee = items.reduce(
    (sum, task) => sum + (task.serviceFee ?? 0),
    0
  );
  return {
    totalDisbursement,
    totalRecovery,
    totalMobilized,
    totalServiceFee,
    netOutstanding: totalDisbursement - totalRecovery,
  };
};

export const parseDateOnly = (value?: string | null) => {
  if (!value) return null;
  const dateOnly = value.includes("T") ? value.split("T")[0] : value;
  const parsed = new Date(dateOnly);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export type ReminderItem = {
  id: string;
  title: string;
  type: Task["type"];
  deadline: string;
  score: number;
  reason: string;
  amount: number;
};

export const buildReminderItems = (tasks: Task[]): ReminderItem[] => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return tasks
    .filter((task) => !task.completed)
    .map((task) => {
      const deadline = parseDateOnly(task.deadline);
      if (!deadline) return null;
      const diffDays = Math.ceil(
        (deadline.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
      );

      let score = 0;
      let reason = "Trong tuần";
      if (diffDays < 0) {
        score += 60;
        reason = "Quá hạn";
      } else if (diffDays === 0) {
        score += 50;
        reason = "Hôm nay";
      } else if (diffDays <= 3) {
        score += 35;
        reason = "Sắp đến hạn";
      } else if (diffDays <= 7) {
        score += 20;
      } else {
        score += 5;
        reason = "Theo dõi";
      }

      const amount =
        (task.amountDisbursement ?? 0) +
        (task.amountRecovery ?? 0) +
        (task.amountMobilized ?? 0);
      if (amount >= 1_000_000_000) score += 25;
      else if (amount >= 300_000_000) score += 15;
      else if (amount >= 100_000_000) score += 8;

      return {
        id: task.id,
        title: task.title,
        type: task.type,
        deadline: deadline.toISOString(),
        score,
        reason,
        amount,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
};
