export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

/** Chuỗi chỉ chữ số (để lưu state input). */
export const digitsOnly = (value: string) => value.replace(/\D/g, "");

/** Định dạng số với dấu phân tách hàng nghìn (1.000.000). */
export const formatThousand = (value: string | number | undefined | null): string => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits === "") return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const clampPercent = (value: number) =>
  Math.min(100, Math.max(0, value));

export const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const formatDate = (value: string | Date) => {
  if (!value) return "";
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const cleanValue = value.includes("T") ? value.split("T")[0] : value;
  const dateParts = cleanValue.split("-");
  if (dateParts.length === 3) {
    const [year, month, day] = dateParts;
    if (year && month && day) {
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

export const escapeCsvValue = (value: string) => {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const getDeadlineTone = (deadline?: string | null) => {
  if (!deadline) {
    return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
  }
  const dateOnly = deadline.includes("T") ? deadline.split("T")[0] : deadline;
  const target = new Date(dateOnly);
  const now = new Date();
  const diffDays = Math.ceil(
    (target.getTime() - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 1) {
    return "bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400";
  }
  if (diffDays <= 3) {
    return "bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400";
  }
  return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
};
