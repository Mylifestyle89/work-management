"use client";

import { useEffect, useMemo, useState } from "react";
import { Inter } from "next/font/google";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeDollarSign,
  Banknote,
  Calendar,
  LayoutDashboard,
  ListChecks,
  Pencil,
  Plus,
  Target,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";

type TaskType =
  | "Giải ngân"
  | "Thẩm định"
  | "Huy động vốn"
  | "Thu nợ"
  | "Hồ sơ vay"
  | "Hồ sơ thế chấp"
  | "Khác";

type Quadrant = "Q1" | "Q2" | "Q3" | "Q4";

type Task = {
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
  position?: number | null;
  createdAt: string;
};

const taskTypes: TaskType[] = [
  "Giải ngân",
  "Thẩm định",
  "Huy động vốn",
  "Thu nợ",
  "Hồ sơ vay",
  "Hồ sơ thế chấp",
  "Khác",
];

const quadrants: {
  id: Quadrant;
  title: string;
  subtitle: string;
  className: string;
  accent: string;
  badge: string;
}[] = [
  {
    id: "Q1",
    title: "Quan trọng & Khẩn cấp",
    subtitle: "Ưu tiên xử lý ngay",
    className: "border-rose-200/70 bg-gradient-to-br from-rose-50 to-fuchsia-50",
    accent: "bg-gradient-to-b from-fuchsia-500 to-rose-500",
    badge: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    id: "Q2",
    title: "Quan trọng nhưng không khẩn cấp",
    subtitle: "Lập kế hoạch tối ưu",
    className:
      "border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50",
    accent: "bg-gradient-to-b from-emerald-500 to-teal-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "Q3",
    title: "Khẩn cấp nhưng không quan trọng",
    subtitle: "Xử lý nhanh, kiểm soát rủi ro",
    className:
      "border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50",
    accent: "bg-gradient-to-b from-amber-500 to-orange-500",
    badge: "bg-orange-100 text-orange-700",
  },
  {
    id: "Q4",
    title: "Không quan trọng & Không khẩn cấp",
    subtitle: "Giảm thiểu hoặc ủy thác",
    className: "border-sky-200/70 bg-gradient-to-br from-sky-50 to-indigo-50",
    accent: "bg-gradient-to-b from-sky-500 to-indigo-500",
    badge: "bg-sky-100 text-sky-700",
  },
];

const TARGETS_STORAGE_KEY = "credit_targets_v1";

type TargetKey = "outstanding" | "mobilized" | "serviceFee";

const defaultTargets = {
  outstanding: 4_000_000_000,
  mobilized: 2_500_000_000,
  serviceFee: 250_000_000,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatDate = (value: string | Date) => {
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

const escapeCsvValue = (value: string) => {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const getDeadlineTone = (deadline?: string | null) => {
  if (!deadline) {
    return "bg-slate-100 text-slate-600";
  }
  const dateOnly = deadline.includes("T") ? deadline.split("T")[0] : deadline;
  const target = new Date(dateOnly);
  const now = new Date();
  const diffDays = Math.ceil(
    (target.getTime() - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 1) {
    return "bg-red-50 text-red-600";
  }
  if (diffDays <= 3) {
    return "bg-orange-50 text-orange-600";
  }
  return "bg-slate-100 text-slate-600";
};

const inter = Inter({
  subsets: ["latin"],
});

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [quadrant, setQuadrant] = useState<Quadrant>("Q1");
  const [type, setType] = useState<TaskType>("Giải ngân");
  const [note, setNote] = useState("");
  const [amountDisbursement, setAmountDisbursement] = useState("");
  const [serviceFee, setServiceFee] = useState("");
  const [amountRecovery, setAmountRecovery] = useState("");
  const [amountMobilized, setAmountMobilized] = useState("");
  const [targetValues, setTargetValues] = useState(defaultTargets);
  const [editingTarget, setEditingTarget] = useState<TargetKey | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingFromQuadrant, setDraggingFromQuadrant] =
    useState<Quadrant | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch("/api/tasks");
        if (!response.ok) return;
        const data = (await response.json()) as Task[];
      setTasks(data);
      } catch (error) {
        console.error("Không thể tải dữ liệu công việc", error);
      }
    };

    loadTasks();
  }, []);

  useEffect(() => {
    const savedTargets = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (!savedTargets) return;
    try {
      const parsed = JSON.parse(savedTargets) as typeof defaultTargets;
      if (
        typeof parsed?.outstanding === "number" &&
        typeof parsed?.mobilized === "number" &&
        typeof parsed?.serviceFee === "number"
      ) {
        setTargetValues(parsed);
      }
    } catch (error) {
      console.error("Không thể tải chỉ tiêu", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targetValues));
  }, [targetValues]);

  const totals = useMemo(() => {
    const totalDisbursement = tasks.reduce(
      (sum, task) => sum + (task.amountDisbursement ?? 0),
      0
    );
    const totalRecovery = tasks.reduce(
      (sum, task) => sum + (task.amountRecovery ?? 0),
      0
    );
    const totalMobilized = tasks.reduce(
      (sum, task) => sum + (task.amountMobilized ?? 0),
      0
    );
    const totalServiceFee = tasks.reduce(
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
  }, [tasks]);

  const typeBadgeMap: Record<TaskType, string> = {
    "Giải ngân": "bg-blue-50 text-blue-700 ring-blue-100",
    "Thẩm định": "bg-violet-50 text-violet-700 ring-violet-100",
    "Huy động vốn": "bg-emerald-50 text-emerald-700 ring-emerald-100",
    "Thu nợ": "bg-amber-50 text-amber-700 ring-amber-100",
    "Hồ sơ vay": "bg-sky-50 text-sky-700 ring-sky-100",
    "Hồ sơ thế chấp": "bg-indigo-50 text-indigo-700 ring-indigo-100",
    Khác: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  const progressCards: {
    key: TargetKey;
    title: string;
    icon: typeof Banknote;
    value: number;
    target: number;
  }[] = [
    {
      key: "outstanding",
      title: "Dư nợ thuần",
      icon: Banknote,
      value: totals.netOutstanding,
      target: targetValues.outstanding,
    },
    {
      key: "mobilized",
      title: "Huy động vốn",
      icon: Target,
      value: totals.totalMobilized,
      target: targetValues.mobilized,
    },
    {
      key: "serviceFee",
      title: "Phí dịch vụ",
      icon: BadgeDollarSign,
      value: totals.totalServiceFee,
      target: targetValues.serviceFee,
    },
  ];

  const chartData = useMemo(
    () =>
      taskTypes.map((label) => ({
        label,
        value: tasks.filter((task) => task.type === label).length,
      })),
    [tasks]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: editingTaskId ?? createId(),
      title: title.trim(),
      quadrant,
      type,
      note: type === "Khác" ? note.trim() || undefined : undefined,
      deadline: deadline || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (type === "Giải ngân") {
      newTask.amountDisbursement = Number(amountDisbursement) || 0;
      newTask.serviceFee = Number(serviceFee) || 0;
    }

    if (type === "Thu nợ") {
      newTask.amountRecovery = Number(amountRecovery) || 0;
    }

    if (type === "Huy động vốn") {
      newTask.amountMobilized = Number(amountMobilized) || 0;
    }

    try {
      const isEditing = Boolean(editingTaskId);
      const response = await fetch(
        isEditing ? `/api/tasks/${editingTaskId}` : "/api/tasks",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTask.title,
            quadrant: newTask.quadrant,
            type: newTask.type,
            note: newTask.note,
            deadline: newTask.deadline,
            amountDisbursement: newTask.amountDisbursement,
            serviceFee: newTask.serviceFee,
            amountRecovery: newTask.amountRecovery,
            amountMobilized: newTask.amountMobilized,
            completed: newTask.completed ?? false,
          }),
        }
      );
      if (!response.ok) return;
      const created = (await response.json()) as Task;
      setTasks((prev) =>
        isEditing
          ? prev.map((item) => (item.id === created.id ? created : item))
          : [created, ...prev]
      );
      setTitle("");
      setDeadline("");
      setNote("");
      setAmountDisbursement("");
      setServiceFee("");
      setAmountRecovery("");
      setAmountMobilized("");
      setEditingTaskId(null);
    } catch (error) {
      console.error("Không thể tạo công việc", error);
    }
  };

  const removeTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) return;
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Không thể xóa công việc", error);
    }
  };

  const toggleCompleted = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!response.ok) return;
      const updated = (await response.json()) as Task;
      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? updated : item))
      );
    } catch (error) {
      console.error("Không thể cập nhật trạng thái", error);
    }
  };

  const getOrderedQuadrantTasks = (quadrantId: Quadrant) =>
    tasks
      .filter((task) => task.quadrant === quadrantId)
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const moveTaskToQuadrant = async (taskId: string, quadrantId: Quadrant) => {
    const original = tasks.find((task) => task.id === taskId);
    if (!original || original.quadrant === quadrantId) return;

    const maxPosition = Math.max(
      0,
      ...tasks
        .filter((task) => task.quadrant === quadrantId)
        .map((task) => task.position ?? 0)
    );
    const nextPosition = maxPosition + 1;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, quadrant: quadrantId, position: nextPosition }
          : task
      )
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quadrant: quadrantId }),
      });
      if (!response.ok) {
        throw new Error("Không thể cập nhật ma trận");
      }
    } catch (error) {
      console.error("Không thể cập nhật ma trận", error);
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                quadrant: original.quadrant,
                position: original.position ?? 0,
              }
            : task
        )
      );
    }
  };

  const reorderWithinQuadrant = async (
    quadrantId: Quadrant,
    orderedIds: string[]
  ) => {
    const originalTasks = getOrderedQuadrantTasks(quadrantId);
    setTasks((prev) =>
      prev.map((task) => {
        const index = orderedIds.indexOf(task.id);
        if (task.quadrant !== quadrantId || index === -1) return task;
        return { ...task, position: index + 1 };
      })
    );

    try {
      const response = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quadrant: quadrantId, orderedIds }),
      });
      if (!response.ok) {
        throw new Error("Không thể sắp xếp lại");
      }
    } catch (error) {
      console.error("Không thể sắp xếp lại", error);
      setTasks((prev) =>
        prev.map((task) => {
          const original = originalTasks.find((item) => item.id === task.id);
          return original ? { ...task, position: original.position } : task;
        })
      );
    }
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDeadline(task.deadline ? task.deadline.split("T")[0] : "");
    setQuadrant(task.quadrant);
    setType(task.type);
    setNote(task.note ?? "");
    setAmountDisbursement(
      task.amountDisbursement ? String(task.amountDisbursement) : ""
    );
    setServiceFee(task.serviceFee ? String(task.serviceFee) : "");
    setAmountRecovery(task.amountRecovery ? String(task.amountRecovery) : "");
    setAmountMobilized(task.amountMobilized ? String(task.amountMobilized) : "");
    setIsTaskModalOpen(true);
  };

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setTitle("");
    setDeadline("");
    setQuadrant("Q1");
    setType("Giải ngân");
    setNote("");
    setAmountDisbursement("");
    setServiceFee("");
    setAmountRecovery("");
    setAmountMobilized("");
  };

  const exportCsv = () => {
    const headers = [
      "Tên công việc",
      "Loại nghiệp vụ",
      "Ma trận",
      "Ghi chú",
      "Deadline",
      "Ngày tạo",
      "Giải ngân",
      "Phí dịch vụ",
      "Thu nợ",
      "Huy động vốn",
    ];

    const rows = tasks.map((task) => [
      task.title,
      task.type,
      task.quadrant,
      task.note ?? "",
      task.deadline ? formatDate(task.deadline) : "",
      formatDate(task.createdAt),
      task.amountDisbursement ? String(task.amountDisbursement) : "",
      task.serviceFee ? String(task.serviceFee) : "",
      task.amountRecovery ? String(task.amountRecovery) : "",
      task.amountMobilized ? String(task.amountMobilized) : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cong-viec-${formatDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const printableRows = tasks
      .map(
        (task) => `
          <tr>
            <td>${task.title}</td>
            <td>${task.type}</td>
            <td>${task.quadrant}</td>
            <td>${task.note ?? "-"}</td>
            <td>${task.deadline ? formatDate(task.deadline) : "-"}</td>
            <td>${formatDate(task.createdAt)}</td>
            <td>${task.amountDisbursement ? formatCurrency(task.amountDisbursement) : "-"}</td>
            <td>${task.serviceFee ? formatCurrency(task.serviceFee) : "-"}</td>
            <td>${task.amountRecovery ? formatCurrency(task.amountRecovery) : "-"}</td>
            <td>${task.amountMobilized ? formatCurrency(task.amountMobilized) : "-"}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Danh sách công việc</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { font-size: 18px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Danh sách công việc (${formatDate(new Date())})</h1>
          <table>
            <thead>
              <tr>
                <th>Tên công việc</th>
                <th>Loại nghiệp vụ</th>
                <th>Ma trận</th>
                <th>Ghi chú</th>
                <th>Deadline</th>
                <th>Ngày tạo</th>
                <th>Giải ngân</th>
                <th>Phí dịch vụ</th>
                <th>Thu nợ</th>
                <th>Huy động vốn</th>
              </tr>
            </thead>
            <tbody>
              ${printableRows || "<tr><td colspan='10'>Chưa có dữ liệu.</td></tr>"}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-20 flex-col items-center gap-6 border-r border-slate-200/70 bg-white py-8 text-slate-500 md:flex">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-200/50">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: "Tổng quan", icon: LayoutDashboard, href: "#overview" },
              { label: "Công việc", icon: ListChecks, href: "#tasks" },
              { label: "Chỉ tiêu", icon: Target, href: "#targets" },
              { label: "Phí dịch vụ", icon: BadgeDollarSign, href: "#fees" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent bg-slate-50 text-slate-500 transition-all hover:border-slate-200/70 hover:bg-white hover:text-slate-900 hover:shadow-sm hover:shadow-slate-200/50"
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
          <div className="mt-auto text-[11px] uppercase tracking-[0.3em] text-slate-300">
            Ops
          </div>
        </aside>

        <main className="flex-1 space-y-8 px-6 py-8 lg:px-10">
          <header
            className={`${inter.className} flex flex-wrap items-center justify-between gap-4`}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
                Premium banking workspace
              </p>
              <h1 className="text-2xl font-semibold text-slate-800">
                Quản trị công việc tín dụng
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200/70 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm shadow-slate-200/50">
                {formatDate(new Date())}
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="rounded-lg border border-slate-200/70 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm shadow-slate-200/50 transition-all hover:shadow-md"
              >
                Lịch sử công việc
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-slate-200/50 transition-all hover:shadow-md"
                onClick={() => setIsTaskModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Thêm công việc mới
              </button>
            </div>
          </header>

          <section id="targets" className="grid gap-4 lg:grid-cols-3">
            {progressCards.map((card) => {
              const percent = clampPercent(
                (card.value / card.target) * 100
              );
              const isEditing = editingTarget === card.key;
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm shadow-slate-200/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        <Icon className="h-4 w-4 text-slate-400" />
                        {card.title}
                      </div>
                      <p className="text-2xl font-semibold text-slate-900">
                        {formatCurrency(card.value)}
                      </p>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            aria-label={`Chỉ tiêu ${card.title}`}
                            className="h-9 w-full rounded-lg border border-slate-200/70 px-3 text-xs focus:border-blue-500 focus:outline-none"
                            value={card.target}
                            onChange={(event) =>
                              setTargetValues((prev) => ({
                                ...prev,
                                [card.key]: Number(event.target.value) || 0,
                              }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() => setEditingTarget(null)}
                            className="rounded-lg border border-slate-200/70 px-3 py-2 text-[11px] font-semibold text-slate-600 transition-all hover:shadow-md"
                          >
                            Xong
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          / {formatCurrency(card.target)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTarget((prev) =>
                          prev === card.key ? null : card.key
                        )
                      }
                      className="rounded-2xl border border-slate-200/60 bg-slate-50 p-3 transition-all hover:shadow-md"
                      aria-label={`Chỉnh sửa ${card.title}`}
                    >
                      <Icon className="h-5 w-5 text-slate-500" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <progress
                      className="progress-bar"
                      value={percent}
                      max={100}
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      Hoàn thành {percent.toFixed(0)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          <section
            id="overview"
            className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <div
              className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Tổng hợp trạng thái công việc
                  </h2>
                  <p className="text-sm text-slate-500">
                    Theo dõi nhanh phân bổ ưu tiên theo ma trận
                  </p>
                </div>
                <ListChecks className="h-6 w-6 text-slate-400" />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {quadrants.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200/60 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        {item.title}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.badge}`}
                      >
                        {tasks.filter((task) => task.quadrant === item.id).length}{" "}
                        việc
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.subtitle}
                    </p>
                  </div>
                ))}
                <div className="md:col-span-2 text-xs text-slate-400">
                  Tổng công việc hiện có: {tasks.length}
                </div>
              </div>
            </div>

            <div
              id="fees"
              className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50"
            >
              <h2 className="text-lg font-semibold text-slate-800">
                Phân bổ công việc theo loại
              </h2>
              <p className="text-sm text-slate-500">
                Theo dõi nhanh khối lượng nghiệp vụ
              </p>
              <div className="mt-6 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(15, 23, 42, 0.05)" }}
                      formatter={(value) => [`${value} việc`, "Số lượng"]}
                    />
                    <Bar
                      dataKey="value"
                      fill="#1d4ed8"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section id="tasks">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Ma trận Eisenhower
              </h2>
              <p className="text-xs text-slate-400">
                Thẻ công việc có màu theo mức ưu tiên
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {quadrants.map((quad) => (
                <div
                  key={quad.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const taskId = event.dataTransfer.getData("text/plain");
                    if (taskId) {
                      moveTaskToQuadrant(taskId, quad.id);
                    }
                  }}
                  className={`relative overflow-hidden rounded-2xl border p-5 ${quad.className}`}
                >
                  <span
                    className={`absolute left-0 top-0 h-full w-1.5 ${quad.accent}`}
                  />
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">
                        {quad.title}
                      </h3>
                      <p className="text-xs text-slate-500">{quad.subtitle}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${quad.badge}`}
                    >
                      {tasks.filter((task) => task.quadrant === quad.id).length}{" "}
                      việc
                    </span>
                  </div>

                  <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
                    {tasks
                      .filter((task) => task.quadrant === quad.id)
                      .slice()
                      .sort(
                        (a, b) => (a.position ?? 0) - (b.position ?? 0)
                      )
                      .map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(event) => {
                            setDraggingTaskId(task.id);
                            setDraggingFromQuadrant(task.quadrant);
                            event.dataTransfer.setData("text/plain", task.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setDraggingTaskId(null);
                            setDraggingFromQuadrant(null);
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            const taskId = event.dataTransfer.getData("text/plain");
                            if (!taskId) return;

                            if (draggingFromQuadrant === quad.id) {
                              const orderedIds = getOrderedQuadrantTasks(
                                quad.id
                              ).map((item) => item.id);
                              const fromIndex = orderedIds.indexOf(taskId);
                              const toIndex = orderedIds.indexOf(task.id);
                              if (fromIndex === -1 || toIndex === -1) return;
                              orderedIds.splice(fromIndex, 1);
                              orderedIds.splice(toIndex, 0, taskId);
                              reorderWithinQuadrant(quad.id, orderedIds);
                            } else {
                              moveTaskToQuadrant(taskId, quad.id);
                            }
                          }}
                          className={`rounded-xl border border-slate-200/50 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:border-indigo-300 hover:shadow-md ${
                            draggingTaskId === task.id
                              ? "opacity-70 ring-2 ring-blue-200"
                              : ""
                          }`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-1 items-start gap-4">
                              <button
                                type="button"
                                onClick={() => toggleCompleted(task)}
                                className={`transition-all ${
                                  task.completed
                                    ? "text-emerald-500"
                                    : "text-slate-300 hover:text-emerald-500"
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
                                      ? "text-slate-400 line-through"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {task.title}
                                </p>
                              </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${typeBadgeMap[task.type]}`}
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
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                      Ghi chú: {task.note}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-6 lg:justify-end">
                              <div className="rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
                                <div className="flex items-center justify-between gap-6">
                                  <span>Giải ngân</span>
                                  <span className="font-semibold text-slate-900">
                                    {task.amountDisbursement
                                      ? formatCurrency(task.amountDisbursement)
                                      : "--"}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-6">
                                  <span>Phí dịch vụ</span>
                                  <span className="font-semibold text-slate-900">
                                    {task.serviceFee
                                      ? formatCurrency(task.serviceFee)
                                      : "--"}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-6">
                                  <span>Thu nợ</span>
                                  <span className="font-semibold text-slate-900">
                                    {task.amountRecovery
                                      ? formatCurrency(task.amountRecovery)
                                      : "--"}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-6">
                                  <span>Huy động</span>
                                  <span className="font-semibold text-slate-900">
                                    {task.amountMobilized
                                      ? formatCurrency(task.amountMobilized)
                                      : "--"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-slate-400">
                                <button
                                  type="button"
                                  onClick={() => startEditTask(task)}
                                  className="rounded-lg p-2 transition hover:text-slate-700"
                                  aria-label="Sửa công việc"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeTask(task.id)}
                                  className="rounded-lg p-2 transition hover:text-rose-500"
                                  aria-label="Xóa công việc"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                    {tasks.filter((task) => task.quadrant === quad.id).length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-slate-200/70 bg-white/70 p-4 text-xs text-slate-400">
                        Chưa có công việc nào trong nhóm này.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 p-4">
          <div className="flex h-full w-full max-w-lg flex-col rounded-2xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Lịch sử công việc
                </h3>
                <p className="text-xs text-slate-500">
                  Bao gồm cả công việc đã hoàn thành.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-lg border border-slate-200/70 px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md"
              >
                Đóng
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200/70 px-5 py-3">
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md"
              >
                Xuất CSV
              </button>
              <button
                type="button"
                onClick={exportPdf}
                className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md"
              >
                Xuất PDF
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {tasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50 p-4 text-xs text-slate-400">
                  Chưa có dữ liệu lịch sử.
                </div>
              )}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm shadow-slate-200/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${typeBadgeMap[task.type]}`}
                        >
                          {task.type}
                        </span>
                        {task.deadline ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            Deadline: {formatDate(task.deadline)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        task.completed
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {task.completed ? "Hoàn thành" : "Đang xử lý"}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    {task.completedAt
                      ? `Hoàn thành: ${formatDate(task.completedAt)}`
                      : `Tạo lúc: ${formatDate(task.createdAt)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Tạo công việc mới
                </h2>
                <p className="text-sm text-slate-500">
                  Lưu tự động trong localStorage cho demo
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTaskModalOpen(false);
                  resetTaskForm();
                }}
                className="rounded-lg border border-slate-200/70 px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md"
              >
                Đóng
              </button>
            </div>

            <form
              onSubmit={(event) => {
                handleSubmit(event);
                setIsTaskModalOpen(false);
                resetTaskForm();
              }}
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <label
                  htmlFor="task-title"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                >
                  Tên khách hàng
                </label>
                <input
                  id="task-title"
                  className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>

              <div>
                <label
                  htmlFor="task-deadline"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                >
                  Deadline hoàn thành
                </label>
                <input
                  id="task-deadline"
                  type="date"
                  className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="task-quadrant"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                >
                  Ma trận ưu tiên
                </label>
                <select
                  id="task-quadrant"
                  className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  value={quadrant}
                  onChange={(event) =>
                    setQuadrant(event.target.value as Quadrant)
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
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                >
                  Loại nghiệp vụ
                </label>
                <select
                  id="task-type"
                  className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as TaskType)
                  }
                >
                  {taskTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {type === "Giải ngân" && (
                <>
                  <div>
                    <label
                      htmlFor="amount-disbursement"
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                    >
                      Số tiền giải ngân
                    </label>
                    <input
                      id="amount-disbursement"
                      type="number"
                      min="0"
                      className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      value={amountDisbursement}
                      onChange={(event) =>
                        setAmountDisbursement(event.target.value)
                      }
                      placeholder="Ví dụ: 500000000"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="service-fee"
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                    >
                      Phí dịch vụ
                    </label>
                    <input
                      id="service-fee"
                      type="number"
                      min="0"
                      className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      value={serviceFee}
                      onChange={(event) => setServiceFee(event.target.value)}
                      placeholder="Ví dụ: 3000000"
                    />
                  </div>
                </>
              )}

              {type === "Thu nợ" && (
                <div>
                  <label
                    htmlFor="amount-recovery"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                  >
                    Số tiền thu hồi
                  </label>
                  <input
                    id="amount-recovery"
                    type="number"
                    min="0"
                    className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    value={amountRecovery}
                    onChange={(event) => setAmountRecovery(event.target.value)}
                    placeholder="Ví dụ: 200000000"
                  />
                </div>
              )}

              {type === "Huy động vốn" && (
                <div>
                  <label
                    htmlFor="amount-mobilized"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                  >
                    Số tiền huy động
                  </label>
                  <input
                    id="amount-mobilized"
                    type="number"
                    min="0"
                    className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    value={amountMobilized}
                    onChange={(event) =>
                      setAmountMobilized(event.target.value)
                    }
                    placeholder="Ví dụ: 150000000"
                  />
                </div>
              )}

              {type === "Khác" && (
                <div className="md:col-span-2">
                  <label
                    htmlFor="task-note"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                  >
                    Ghi chú loại công việc
                  </label>
                  <input
                    id="task-note"
                    className="mt-2 w-full rounded-lg border border-slate-200/70 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ví dụ: Gia hạn hợp đồng, tái thẩm định..."
                  />
                </div>
              )}

              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-200/50 transition-all hover:shadow-md"
                >
                  {editingTaskId ? "Lưu thay đổi" : "Thêm công việc"}
                </button>
                <p className="text-xs text-slate-400">
                  Tổng công việc hiện có: {tasks.length}
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
