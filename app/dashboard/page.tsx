"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Banknote, Target } from "lucide-react";
import {
  type Task,
  type Quadrant,
  type TargetKey,
  type TargetValues,
  type MonthlyTargetValues,
  type OutstandingExtras,
  defaultTargets,
  defaultMonthlyTargets,
  defaultOutstandingExtras,
  TARGETS_STORAGE_KEY,
  MONTHLY_TARGETS_STORAGE_KEY,
  OUTSTANDING_EXTRAS_STORAGE_KEY,
  OUTSTANDING_PREVIOUS_DAY_KEY,
} from "@/lib/dashboard/types";
import {
  formatCurrency,
  formatDate,
  createId,
} from "@/lib/dashboard/utils";
import * as XLSX from "xlsx";
import {
  Sidebar,
  Header,
  ProgressCards,
  TargetEditModal,
  OverviewSection,
  TaskChart,
  EisenhowerSection,
  HistoryDrawer,
  TaskModal,
  type TaskFormState,
} from "./components";

const initialFormState: TaskFormState = {
  title: "",
  deadline: "",
  quadrant: "Q1",
  type: "Giải ngân",
  note: "",
  amountDisbursement: "",
  serviceFee: "",
  amountRecovery: "",
  amountMobilized: "",
};

type TasksResponse = {
  tasks: Task[];
  totals: {
    totalDisbursement: number;
    totalRecovery: number;
    totalMobilized: number;
    totalServiceFee: number;
    netOutstanding: number;
  };
};

const summarizeTotals = (items: Task[]) => {
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

export default function DashboardPage() {
  type TaskFilter =
    | "all"
    | "today"
    | "thisWeek"
    | "overdue"
    | "completed"
    | "pending";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalsFromApi, setTotalsFromApi] = useState<TasksResponse["totals"] | null>(null);
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [allTasksForProgress, setAllTasksForProgress] = useState<Task[]>([]);
  const [form, setForm] = useState<TaskFormState>(initialFormState);
  const [targetValues, setTargetValues] = useState<TargetValues>(defaultTargets);
  const [monthlyTargets, setMonthlyTargets] =
    useState<MonthlyTargetValues>(defaultMonthlyTargets);
  const [targetForm, setTargetForm] = useState({
    monthlyTarget: "",
    annualTarget: "",
    startOfDay: "",
    startOfMonth: "",
    startOfYear: "",
  });
  const [outstandingExtras, setOutstandingExtras] =
    useState<OutstandingExtras>(defaultOutstandingExtras);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetKey | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingFromQuadrant, setDraggingFromQuadrant] =
    useState<Quadrant | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");

  const loadTasks = useCallback(async () => {
    try {
      const [activeResponse, allResponse] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/tasks?includeArchived=true"),
      ]);
      if (activeResponse.ok) {
        const data = (await activeResponse.json()) as TasksResponse;
        setTasks(data.tasks);
        setTotalsFromApi(data.totals);
      }
      if (allResponse.ok) {
        const data = (await allResponse.json()) as TasksResponse;
        setAllTasksForProgress(data.tasks);
      }
    } catch (error) {
      console.error("Không thể tải dữ liệu công việc", error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const loadHistoryTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks?includeArchived=true");
      if (!response.ok) return;
      const data = (await response.json()) as TasksResponse;
      setHistoryTasks(data.tasks);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isHistoryOpen) return;
    setHistoryLoading(true);
    loadHistoryTasks()
      .finally(() => setHistoryLoading(false));
  }, [isHistoryOpen, loadHistoryTasks]);

  useEffect(() => {
    const savedTargets = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (!savedTargets) return;
    try {
      const parsed = JSON.parse(savedTargets) as TargetValues;
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

  useEffect(() => {
    const savedMonthlyTargets = localStorage.getItem(MONTHLY_TARGETS_STORAGE_KEY);
    if (!savedMonthlyTargets) return;
    try {
      const parsed = JSON.parse(savedMonthlyTargets) as MonthlyTargetValues;
      if (
        typeof parsed?.outstanding === "number" &&
        typeof parsed?.mobilized === "number" &&
        typeof parsed?.serviceFee === "number"
      ) {
        setMonthlyTargets(parsed);
      }
    } catch (error) {
      console.error("Không thể tải chỉ tiêu tháng", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      MONTHLY_TARGETS_STORAGE_KEY,
      JSON.stringify(monthlyTargets)
    );
  }, [monthlyTargets]);

  useEffect(() => {
    const saved = localStorage.getItem(OUTSTANDING_EXTRAS_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as OutstandingExtras;
      if (
        typeof parsed?.startOfDay === "number" &&
        typeof parsed?.startOfMonth === "number"
      ) {
        setOutstandingExtras({
          ...defaultOutstandingExtras,
          ...parsed,
          startOfYear:
            typeof parsed.startOfYear === "number" ? parsed.startOfYear : 0,
        });
      }
    } catch (error) {
      console.error("Không thể tải chỉ tiêu dư nợ", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      OUTSTANDING_EXTRAS_STORAGE_KEY,
      JSON.stringify(outstandingExtras)
    );
  }, [outstandingExtras]);

  const totals = useMemo(() => {
    if (totalsFromApi) return totalsFromApi;
    const source = allTasksForProgress.length ? allTasksForProgress : tasks;
    return summarizeTotals(source);
  }, [allTasksForProgress, totalsFromApi, tasks]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }, []);

  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") return tasks;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const parseDeadline = (deadline?: string | null) => {
      if (!deadline) return null;
      const dateOnly = deadline.includes("T") ? deadline.split("T")[0] : deadline;
      const parsed = new Date(dateOnly);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    return tasks.filter((task) => {
      const deadline = parseDeadline(task.deadline);
      switch (taskFilter) {
        case "completed":
          return Boolean(task.completed);
        case "pending":
          return !task.completed;
        case "today":
          return deadline
            ? deadline.toISOString().slice(0, 10) === todayKey
            : false;
        case "thisWeek":
          return deadline ? deadline >= startOfToday && deadline <= endOfWeek : false;
        case "overdue":
          return deadline ? deadline < startOfToday && !task.completed : false;
        default:
          return true;
      }
    });
  }, [taskFilter, tasks, todayKey]);

  const progressSnapshot = useMemo(() => {
    const source = allTasksForProgress.length ? allTasksForProgress : tasks;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const dayTasks: Task[] = [];
    const yearTasks: Task[] = [];
    const monthTasks: Task[] = [];

    source.forEach((task) => {
      if (!task.completedAt || !task.completed) return;
      const taskDate = new Date(task.completedAt);
      if (Number.isNaN(taskDate.getTime())) return;
      if (taskDate.toISOString().slice(0, 10) === todayKey) {
        dayTasks.push(task);
      }
      if (taskDate.getFullYear() !== currentYear) return;
      yearTasks.push(task);
      if (taskDate.getMonth() === currentMonth) {
        monthTasks.push(task);
      }
    });

    return {
      monthLabel: `Tháng ${currentMonth + 1}`,
      dayTotals: summarizeTotals(dayTasks),
      yearTotals: summarizeTotals(yearTasks),
      monthTotals: summarizeTotals(monthTasks),
    };
  }, [allTasksForProgress, tasks, todayKey]);

  const progressCards = useMemo(() => {
    const outstandingToday =
      outstandingExtras.startOfDay + progressSnapshot.dayTotals.netOutstanding;

    return [
      {
        key: "outstanding" as const,
        title: "Dư nợ thuần",
        icon: Banknote,
        value: outstandingToday,
        target: targetValues.outstanding,
        monthActual: progressSnapshot.monthTotals.netOutstanding,
        monthTarget: monthlyTargets.outstanding,
        yearActual: progressSnapshot.yearTotals.netOutstanding,
        outstandingStartOfDay: outstandingExtras.startOfDay,
        outstandingStartOfMonth: outstandingExtras.startOfMonth,
        outstandingStartOfYear: outstandingExtras.startOfYear,
      },
      {
        key: "mobilized" as const,
        title: "Huy động vốn",
        icon: Target,
        value: progressSnapshot.yearTotals.totalMobilized,
        target: targetValues.mobilized,
        monthActual: progressSnapshot.monthTotals.totalMobilized,
        monthTarget: monthlyTargets.mobilized,
        yearActual: progressSnapshot.yearTotals.totalMobilized,
      },
      {
        key: "serviceFee" as const,
        title: "Phí dịch vụ",
        icon: BadgeDollarSign,
        value: progressSnapshot.yearTotals.totalServiceFee,
        target: targetValues.serviceFee,
        monthActual: progressSnapshot.monthTotals.totalServiceFee,
        monthTarget: monthlyTargets.serviceFee,
        yearActual: progressSnapshot.yearTotals.totalServiceFee,
      },
    ];
  }, [monthlyTargets, outstandingExtras, progressSnapshot, targetValues]);

  // Nếu user chưa nhập Dư nợ đầu ngày, tự động dùng Dư nợ thuần của ngày trước (nếu có lưu)
  useEffect(() => {
    if (outstandingExtras.startOfDay !== 0) return;
    try {
      const saved = localStorage.getItem(OUTSTANDING_PREVIOUS_DAY_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        date?: string;
        outstanding?: number;
      };
      if (
        parsed &&
        typeof parsed.outstanding === "number" &&
        parsed.date &&
        parsed.date !== todayKey
      ) {
        setOutstandingExtras((prev) => ({
          ...prev,
          startOfDay: parsed.outstanding ?? prev.startOfDay,
        }));
      }
    } catch {
      // ignore
    }
  }, [outstandingExtras.startOfDay, todayKey]);

  // Luôn lưu lại Dư nợ thuần hiện tại để dùng làm Dư nợ đầu ngày cho ngày tiếp theo
  useEffect(() => {
    const outstandingToday =
      outstandingExtras.startOfDay + progressSnapshot.monthTotals.netOutstanding;
    if (!Number.isFinite(outstandingToday)) return;
    try {
      localStorage.setItem(
        OUTSTANDING_PREVIOUS_DAY_KEY,
        JSON.stringify({
          date: todayKey,
          outstanding: outstandingToday,
        })
      );
    } catch {
      // ignore
    }
  }, [outstandingExtras.startOfDay, progressSnapshot.monthTotals.netOutstanding, todayKey]);

  const currentTargetTitle = useMemo(() => {
    if (!editingTarget) return "";
    if (editingTarget === "outstanding") return "Dư nợ thuần";
    if (editingTarget === "mobilized") return "Huy động vốn";
    return "Phí dịch vụ";
  }, [editingTarget]);

  const handleTargetModalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTarget) return;

    const trimmedMonthly = targetForm.monthlyTarget.trim();
    const trimmedAnnual = targetForm.annualTarget.trim();

    if (trimmedAnnual) {
      const nextValue = Number(trimmedAnnual);
      if (!Number.isNaN(nextValue)) {
        setTargetValues((prev) => ({ ...prev, [editingTarget]: nextValue }));
      }
    }

    if (trimmedMonthly) {
      const nextValue = Number(trimmedMonthly);
      if (!Number.isNaN(nextValue)) {
        setMonthlyTargets((prev) => ({ ...prev, [editingTarget]: nextValue }));
      }
    }

    if (editingTarget === "outstanding") {
      const trimmedStartOfDay = (targetForm.startOfDay ?? "").trim();
      const trimmedStartOfMonth = (targetForm.startOfMonth ?? "").trim();
      const trimmedStartOfYear = (targetForm.startOfYear ?? "").trim();
      if (trimmedStartOfDay) {
        const v = Number(trimmedStartOfDay);
        if (!Number.isNaN(v)) setOutstandingExtras((prev) => ({ ...prev, startOfDay: v }));
      }
      if (trimmedStartOfMonth) {
        const v = Number(trimmedStartOfMonth);
        if (!Number.isNaN(v)) setOutstandingExtras((prev) => ({ ...prev, startOfMonth: v }));
      }
      if (trimmedStartOfYear) {
        const v = Number(trimmedStartOfYear);
        if (!Number.isNaN(v)) setOutstandingExtras((prev) => ({ ...prev, startOfYear: v }));
      }
    }

    setTargetForm({ monthlyTarget: "", annualTarget: "", startOfDay: "", startOfMonth: "", startOfYear: "" });
    setEditingTarget(null);
    setIsTargetModalOpen(false);
  };

  const undoCompletedTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false }),
      });
      if (!response.ok) return;
      await loadTasks();
      if (isHistoryOpen) {
        await loadHistoryTasks();
      }
    } catch (error) {
      console.error("Không thể hoàn tác hoàn thành", error);
    }
  };

  const restoreArchivedTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (!response.ok) return;
      await loadTasks();
      if (isHistoryOpen) {
        await loadHistoryTasks();
      }
    } catch (error) {
      console.error("Không thể khôi phục công việc", error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    const newTask: Task = {
      id: editingTaskId ?? createId(),
      title: form.title.trim(),
      quadrant: form.quadrant,
      type: form.type,
      note: form.type === "Khác" ? form.note.trim() || undefined : undefined,
      deadline: form.deadline || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (form.type === "Giải ngân") {
      newTask.amountDisbursement = Number(form.amountDisbursement) || 0;
      newTask.serviceFee = Number(form.serviceFee) || 0;
    }
    if (form.type === "Thu nợ") {
      newTask.amountRecovery = Number(form.amountRecovery) || 0;
    }
    if (form.type === "Huy động vốn") {
      newTask.amountMobilized = Number(form.amountMobilized) || 0;
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
      setForm(initialFormState);
      setEditingTaskId(null);
      await loadTasks();
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
      await loadTasks();
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
      await loadTasks();
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
      if (!response.ok) throw new Error("Không thể cập nhật ma trận");
      await loadTasks();
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
      if (!response.ok) throw new Error("Không thể sắp xếp lại");
      await loadTasks();
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
    setForm({
      title: task.title,
      deadline: task.deadline ? task.deadline.split("T")[0] : "",
      quadrant: task.quadrant,
      type: task.type,
      note: task.note ?? "",
      amountDisbursement: task.amountDisbursement
        ? String(task.amountDisbursement)
        : "",
      serviceFee: task.serviceFee ? String(task.serviceFee) : "",
      amountRecovery: task.amountRecovery ? String(task.amountRecovery) : "",
      amountMobilized: task.amountMobilized
        ? String(task.amountMobilized)
        : "",
    });
    setIsTaskModalOpen(true);
  };

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setForm(initialFormState);
  };

  const exportExcel = (tasksToExport: Task[] = tasks) => {
    const headers = [
      "Tiêu đề",
      "Ô",
      "Loại",
      "Ghi chú",
      "Hạn",
      "Giải ngân",
      "Phí DV",
      "Thu nợ",
      "Huy động",
      "Trạng thái",
      "Hoàn thành",
      "Lưu trữ",
      "Tạo lúc",
    ];
    const rows = tasksToExport.map((task) => [
      task.title,
      task.quadrant,
      task.type,
      task.note ?? "",
      task.deadline ? formatDate(task.deadline) : "",
      task.amountDisbursement != null ? formatCurrency(task.amountDisbursement) : "",
      task.serviceFee != null ? formatCurrency(task.serviceFee) : "",
      task.amountRecovery != null ? formatCurrency(task.amountRecovery) : "",
      task.amountMobilized != null ? formatCurrency(task.amountMobilized) : "",
      task.completed ? "Hoàn thành" : "Đang xử lý",
      task.completedAt ? formatDate(task.completedAt) : "",
      task.archivedAt ? formatDate(task.archivedAt) : "",
      formatDate(task.createdAt),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Công việc");
    const fileName = `cong-viec-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportPdf = (tasksToExport: Task[] = tasks) => {
    const printableRows = tasksToExport
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

  const handleTaskModalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
    setIsTaskModalOpen(false);
    resetTaskForm();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar activeFilter={taskFilter} onFilterChange={setTaskFilter} />
        <main className="flex-1 space-y-8 px-6 py-8 lg:px-10">
          <Header
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenTaskModal={() => setIsTaskModalOpen(true)}
          />

          <ProgressCards
            cards={progressCards}
            monthLabel={progressSnapshot.monthLabel}
            onOpenTargetModal={(key) => {
              setEditingTarget(key);
              setTargetForm({
                monthlyTarget: "",
                annualTarget: "",
                startOfDay: "",
                startOfMonth: "",
                startOfYear: "",
              });
              setIsTargetModalOpen(true);
            }}
          />

          <section
            id="overview"
            className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <OverviewSection tasks={filteredTasks} />
            <TaskChart tasks={filteredTasks} />
          </section>

          <EisenhowerSection
            tasks={filteredTasks}
            getOrderedQuadrantTasks={getOrderedQuadrantTasks}
            draggingTaskId={draggingTaskId}
            draggingFromQuadrant={draggingFromQuadrant}
            onMoveToQuadrant={moveTaskToQuadrant}
            onReorder={reorderWithinQuadrant}
            onToggleCompleted={toggleCompleted}
            onEdit={startEditTask}
            onRemove={removeTask}
            setDraggingTaskId={setDraggingTaskId}
            setDraggingFromQuadrant={setDraggingFromQuadrant}
          />
        </main>
      </div>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        tasks={historyTasks}
        loading={historyLoading}
        onExportExcel={() => exportExcel(historyTasks)}
        onExportPdf={() => exportPdf(historyTasks)}
        onUndoCompleted={undoCompletedTask}
        onRestoreArchived={restoreArchivedTask}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          resetTaskForm();
        }}
        form={form}
        onChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
        onSubmit={handleTaskModalSubmit}
        taskCount={tasks.length}
        editingTaskId={editingTaskId}
      />

      <TargetEditModal
        isOpen={isTargetModalOpen}
        onClose={() => {
          setIsTargetModalOpen(false);
          setTargetForm({ monthlyTarget: "", annualTarget: "", startOfDay: "", startOfMonth: "", startOfYear: "" });
          setEditingTarget(null);
        }}
        onSubmit={handleTargetModalSubmit}
        title={currentTargetTitle}
        monthlyTarget={
          editingTarget ? monthlyTargets[editingTarget] : 0
        }
        annualTarget={editingTarget ? targetValues[editingTarget] : 0}
        form={targetForm}
        onChange={(updates) =>
          setTargetForm((prev) => ({ ...prev, ...updates }))
        }
        targetKey={editingTarget}
        outstandingStartOfDay={outstandingExtras.startOfDay}
        outstandingStartOfMonth={outstandingExtras.startOfMonth}
        outstandingStartOfYear={outstandingExtras.startOfYear}
      />
    </div>
  );
}
