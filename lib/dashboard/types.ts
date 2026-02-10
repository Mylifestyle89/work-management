export type TaskType =
  | "Giải ngân"
  | "Thẩm định"
  | "Huy động vốn"
  | "Thu nợ"
  | "Hồ sơ vay"
  | "Hồ sơ thế chấp"
  | "Khác";

export type Quadrant = "Q1" | "Q2" | "Q3" | "Q4";

export type Task = {
  id: string;
  title: string;
  quadrant: Quadrant;
  type: TaskType;
  note?: string | null;
  deadline?: string | null;
  amountDisbursement?: number | null;
  serviceFee?: number | null;
  amountRecovery?: number | null;
  amountMobilized?: number | null;
  completed?: boolean | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  position?: number | null;
  createdAt: string;
};

export const taskTypes: TaskType[] = [
  "Giải ngân",
  "Thẩm định",
  "Huy động vốn",
  "Thu nợ",
  "Hồ sơ vay",
  "Hồ sơ thế chấp",
  "Khác",
];

export type QuadrantConfig = {
  id: Quadrant;
  title: string;
  subtitle: string;
  className: string;
  darkClassName?: string;
  accent: string;
  badge: string;
  darkBadge?: string;
};

export const quadrants: QuadrantConfig[] = [
  {
    id: "Q1",
    title: "Quan trọng & Khẩn cấp",
    subtitle: "Ưu tiên xử lý ngay",
    className: "border-rose-200/70 bg-gradient-to-br from-rose-50 to-fuchsia-50",
    darkClassName:
      "dark:border-rose-900/50 dark:from-slate-800 dark:to-rose-950/80",
    accent: "bg-gradient-to-b from-fuchsia-500 to-rose-500",
    badge: "bg-fuchsia-100 text-fuchsia-700",
    darkBadge: "dark:bg-fuchsia-900/50 dark:text-fuchsia-300",
  },
  {
    id: "Q2",
    title: "Quan trọng nhưng không khẩn cấp",
    subtitle: "Lập kế hoạch tối ưu",
    className:
      "border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50",
    darkClassName:
      "dark:border-emerald-900/50 dark:from-slate-800 dark:to-emerald-950/80",
    accent: "bg-gradient-to-b from-emerald-500 to-teal-500",
    badge: "bg-emerald-100 text-emerald-700",
    darkBadge: "dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  {
    id: "Q3",
    title: "Khẩn cấp nhưng không quan trọng",
    subtitle: "Xử lý nhanh, kiểm soát rủi ro",
    className:
      "border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50",
    darkClassName:
      "dark:border-amber-900/50 dark:from-slate-800 dark:to-amber-950/80",
    accent: "bg-gradient-to-b from-amber-500 to-orange-500",
    badge: "bg-orange-100 text-orange-700",
    darkBadge: "dark:bg-amber-900/50 dark:text-amber-300",
  },
  {
    id: "Q4",
    title: "Không quan trọng & Không khẩn cấp",
    subtitle: "Giảm thiểu hoặc ủy thác",
    className: "border-sky-200/70 bg-gradient-to-br from-sky-50 to-indigo-50",
    darkClassName:
      "dark:border-sky-900/50 dark:from-slate-800 dark:to-indigo-950/80",
    accent: "bg-gradient-to-b from-sky-500 to-indigo-500",
    badge: "bg-sky-100 text-sky-700",
    darkBadge: "dark:bg-sky-900/50 dark:text-sky-300",
  },
];

export const TARGETS_STORAGE_KEY = "credit_targets_v1";
export const MONTHLY_TARGETS_STORAGE_KEY = "credit_targets_monthly_v1";
export const OUTSTANDING_EXTRAS_STORAGE_KEY = "credit_outstanding_extras_v1";
export const OUTSTANDING_PREVIOUS_DAY_KEY =
  "credit_outstanding_prev_day_v1";

export type OutstandingExtras = {
  startOfDay: number;
  startOfMonth: number;
  startOfYear: number;
};

export const defaultOutstandingExtras: OutstandingExtras = {
  startOfDay: 0,
  startOfMonth: 0,
  startOfYear: 0,
};

export type TargetKey = "outstanding" | "mobilized" | "serviceFee";

export type TargetValues = {
  outstanding: number;
  mobilized: number;
  serviceFee: number;
};

export const defaultTargets: TargetValues = {
  outstanding: 4_000_000_000,
  mobilized: 2_500_000_000,
  serviceFee: 250_000_000,
};

export type MonthlyTargetValues = TargetValues;

export const defaultMonthlyTargets: MonthlyTargetValues = {
  outstanding: defaultTargets.outstanding / 12,
  mobilized: defaultTargets.mobilized / 12,
  serviceFee: defaultTargets.serviceFee / 12,
};

export const typeBadgeMap: Record<TaskType, string> = {
  "Giải ngân": "bg-blue-50 text-blue-700 ring-blue-100",
  "Thẩm định": "bg-violet-50 text-violet-700 ring-violet-100",
  "Huy động vốn": "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "Thu nợ": "bg-amber-50 text-amber-700 ring-amber-100",
  "Hồ sơ vay": "bg-sky-50 text-sky-700 ring-sky-100",
  "Hồ sơ thế chấp": "bg-indigo-50 text-indigo-700 ring-indigo-100",
  Khác: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const typeBadgeMapDark: Record<TaskType, string> = {
  "Giải ngân": "dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-800",
  "Thẩm định": "dark:bg-violet-900/40 dark:text-violet-300 dark:ring-violet-800",
  "Huy động vốn":
    "dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-800",
  "Thu nợ": "dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800",
  "Hồ sơ vay": "dark:bg-sky-900/40 dark:text-sky-300 dark:ring-sky-800",
  "Hồ sơ thế chấp":
    "dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-800",
  Khác: "dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600",
};
