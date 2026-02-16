"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Banknote, Target } from "lucide-react";
import {
  type Task,
  type Quadrant,
  type TargetKey,
} from "@/lib/dashboard/types";
import {
  createId,
} from "@/lib/dashboard/utils";
import {
  saveTaskApi,
  deleteTaskApi,
  toggleTaskCompletedApi,
  undoTaskCompletedApi,
  moveTaskToQuadrantApi,
  reorderWithinQuadrantApi,
} from "./lib/task-api";
import { exportTasksToExcel, exportTasksToPdf } from "./lib/task-exports";
import {
  type TasksResponse,
  buildReminderItems,
  initialTargetFormState,
  summarizeTotals,
} from "./lib/dashboard-page-helpers";
import { useDayKey } from "./lib/use-day-key";
import { useDashboardTargetSettings } from "./lib/use-dashboard-target-settings";
import { useOutstandingRollover } from "./lib/use-outstanding-rollover";
import {
  Sidebar,
  Header,
  ProgressCards,
  LoanRateCard,
  ReminderSection,
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

type DashboardView = "focus" | "analytics" | "tools";

const VIEW_OPTIONS: Array<{ id: DashboardView; label: string; description: string }> = [
  { id: "focus", label: "Focus", description: "Vận hành hằng ngày" },
  { id: "analytics", label: "Analytics", description: "Theo dõi số liệu" },
  { id: "tools", label: "Tools", description: "Công cụ quản trị" },
];

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalsFromApi, setTotalsFromApi] = useState<TasksResponse["totals"] | null>(null);
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [allTasksForProgress, setAllTasksForProgress] = useState<Task[]>([]);
  const [form, setForm] = useState<TaskFormState>(initialFormState);
  const {
    targetValues,
    setTargetValues,
    monthlyTargets,
    setMonthlyTargets,
    outstandingExtras,
    setOutstandingExtras,
  } = useDashboardTargetSettings();
  const [targetForm, setTargetForm] = useState(initialTargetFormState);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetKey | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingFromQuadrant, setDraggingFromQuadrant] =
    useState<Quadrant | null>(null);
  const [outstandingDisplayAdjustment, setOutstandingDisplayAdjustment] =
    useState(0);
  const [activeView, setActiveView] = useState<DashboardView>("focus");
  const todayKey = useDayKey();
  const secondaryButtonClass =
    "rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

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

  const totals = useMemo(() => {
    if (totalsFromApi) return totalsFromApi;
    const source = allTasksForProgress.length ? allTasksForProgress : tasks;
    return summarizeTotals(source);
  }, [allTasksForProgress, totalsFromApi, tasks]);

  useEffect(() => {
    setOutstandingDisplayAdjustment(0);
  }, [todayKey]);

  const reminderItems = useMemo(() => {
    return buildReminderItems(tasks);
  }, [tasks]);

  const analyticsSummary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const inProgress = Math.max(0, total - completed);
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      reminderCount: reminderItems.length,
      completionRate,
    };
  }, [reminderItems.length, tasks]);

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

    const monthOutstandingNet = monthTasks.reduce(
      (sum, task) =>
        sum + (task.amountDisbursement ?? 0) - (task.amountRecovery ?? 0),
      0
    );

    return {
      monthLabel: `Tháng ${currentMonth + 1}`,
      dayTotals: summarizeTotals(dayTasks),
      yearTotals: summarizeTotals(yearTasks),
      monthTotals: summarizeTotals(monthTasks),
      monthOutstandingNet,
    };
  }, [allTasksForProgress, tasks, todayKey]);

  const progressCards = useMemo(() => {
    const outstandingToday =
      outstandingExtras.startOfDay +
      progressSnapshot.dayTotals.netOutstanding +
      outstandingDisplayAdjustment;

    return [
      {
        key: "outstanding" as const,
        title: "Dư nợ thuần",
        icon: Banknote,
        value: outstandingToday,
        target: targetValues.outstanding,
        monthActual: progressSnapshot.monthOutstandingNet,
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
  }, [
    monthlyTargets,
    outstandingDisplayAdjustment,
    outstandingExtras,
    progressSnapshot,
    targetValues,
  ]);

  const resetOutstandingToStartOfDay = () => {
    const deltaToday = progressSnapshot.dayTotals.netOutstanding;
    if (!Number.isFinite(deltaToday) || deltaToday === 0) return;
    // Chỉ điều chỉnh số Dư nợ thuần hiển thị, không thay đổi Dư nợ đầu ngày.
    setOutstandingDisplayAdjustment(-deltaToday);
  };

  useOutstandingRollover({
    startOfDay: outstandingExtras.startOfDay,
    todayKey,
    dayNetOutstanding: progressSnapshot.dayTotals.netOutstanding,
    setOutstandingExtras,
  });

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

    setTargetForm(initialTargetFormState);
    setEditingTarget(null);
    setIsTargetModalOpen(false);
  };

  const openTargetModal = (key: TargetKey) => {
    setEditingTarget(key);
    setTargetForm(initialTargetFormState);
    setIsTargetModalOpen(true);
  };

  const closeTargetModal = () => {
    setIsTargetModalOpen(false);
    setTargetForm(initialTargetFormState);
    setEditingTarget(null);
  };

  const openTaskModal = () => setIsTaskModalOpen(true);
  const openHistory = () => setIsHistoryOpen(true);
  const closeHistory = () => setIsHistoryOpen(false);

  const refreshTaskViews = async (includeHistory = false) => {
    await loadTasks();
    if (includeHistory && isHistoryOpen) {
      await loadHistoryTasks();
    }
  };

  const undoCompletedTask = async (taskId: string) => {
    try {
      await undoTaskCompletedApi(taskId);
      await refreshTaskViews(true);
    } catch (error) {
      console.error("Không thể hoàn tác hoàn thành", error);
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
      await saveTaskApi(editingTaskId, {
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
      });
      setForm(initialFormState);
      setEditingTaskId(null);
      await refreshTaskViews();
    } catch (error) {
      console.error("Không thể tạo công việc", error);
    }
  };

  const removeTask = async (taskId: string) => {
    try {
      await deleteTaskApi(taskId);
      await refreshTaskViews();
    } catch (error) {
      console.error("Không thể xóa công việc", error);
    }
  };

  const toggleCompleted = async (task: Task) => {
    try {
      await toggleTaskCompletedApi(task.id, !task.completed);
      await refreshTaskViews();
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
      await moveTaskToQuadrantApi(taskId, quadrantId);
      await refreshTaskViews();
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
      await reorderWithinQuadrantApi(quadrantId, orderedIds);
      await refreshTaskViews();
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
    openTaskModal();
  };

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setForm(initialFormState);
  };

  const exportExcel = (tasksToExport: Task[] = tasks) => exportTasksToExcel(tasksToExport);
  const exportPdf = (tasksToExport: Task[] = tasks) => exportTasksToPdf(tasksToExport);

  const handleTaskModalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
    closeTaskModal();
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    resetTaskForm();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar
          onOpenTaskModal={openTaskModal}
          onOpenHistory={openHistory}
        />
        <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <Header
            onOpenHistory={openHistory}
          />

          <section className="space-y-0">
            <div className="sticky top-2 z-20">
              <div className="rounded-t-2xl border-x border-t border-slate-200/70 bg-slate-100/90 px-2 pt-2 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90">
                <div className="flex items-end gap-1.5 overflow-x-auto pb-0.5">
                {VIEW_OPTIONS.map((option) => {
                  const isActive = activeView === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActiveView(option.id)}
                      className={`group relative min-w-[140px] overflow-hidden border px-3 py-2.5 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                        isActive
                          ? "z-10 -mb-px rounded-t-2xl border-slate-200 border-b-white bg-white text-slate-900 shadow-[0_-1px_0_rgba(255,255,255,0.85),0_2px_10px_rgba(15,23,42,0.06)] dark:border-slate-600 dark:border-b-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:shadow-[0_-1px_0_rgba(255,255,255,0.06),0_2px_10px_rgba(2,6,23,0.55)]"
                          : "translate-y-[1px] rounded-t-xl border-slate-200/70 bg-slate-50 text-slate-600 hover:translate-y-0 hover:bg-white hover:text-slate-800 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                      }`}
                      aria-pressed={isActive}
                      aria-current={isActive ? "page" : undefined}
                      title={option.description}
                    >
                      <span
                        aria-hidden
                        className={`pointer-events-none absolute inset-x-3 top-0 h-px rounded-full transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-transparent via-blue-400/70 to-transparent dark:via-blue-300/60"
                            : "bg-transparent group-hover:bg-gradient-to-r group-hover:from-transparent group-hover:via-slate-300/80 group-hover:to-transparent dark:group-hover:via-slate-500/70"
                        }`}
                      />
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isActive
                              ? "bg-blue-500 dark:bg-blue-400"
                              : "bg-slate-300 group-hover:bg-slate-400 dark:bg-slate-500 dark:group-hover:bg-slate-400"
                          }`}
                        />
                        <p className="text-xs font-semibold">{option.label}</p>
                      </div>
                      <p
                        className={`mt-0.5 text-[10px] ${
                          isActive
                            ? "text-slate-500 dark:text-slate-300"
                            : "text-slate-400 dark:text-slate-400"
                        }`}
                      >
                        {option.description}
                      </p>
                    </button>
                  );
                })}
                </div>
              </div>
            </div>

            <section
              key={activeView}
              className="-mt-px min-h-[320px] rounded-b-2xl border-x border-b border-t-0 border-slate-200/70 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5"
            >
            {activeView === "focus" ? (
              <>
              <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <ReminderSection items={reminderItems} />
                <aside className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Bảng điều phối trong ngày
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    Ưu tiên thao tác nhanh trước khi xử lý ma trận công việc.
                  </p>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={openTaskModal}
                      className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md dark:from-blue-600 dark:to-indigo-700"
                    >
                      Thêm công việc mới
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-300">
                    Theo dõi KPI và chỉ tiêu chi tiết trong tab Analytics.
                  </p>
                </aside>
              </section>

              <EisenhowerSection
                tasks={tasks}
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
              </>
            ) : null}

            {activeView === "analytics" ? (
              <>
              <section className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
                <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Chỉ tiêu trọng tâm
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                        Theo dõi kết quả tháng và năm theo từng nhóm KPI.
                      </p>
                    </div>
                  </div>
                  <ProgressCards
                    cards={progressCards}
                    monthLabel={progressSnapshot.monthLabel}
                    onOpenTargetModal={openTargetModal}
                  />
                </div>

                <aside className="h-fit rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm lg:sticky lg:top-24 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Snapshot hôm nay
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    Điểm nhanh để đánh giá tiến độ vận hành.
                  </p>
                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-300">Tổng công việc</p>
                      <p className="mt-0.5 text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {analyticsSummary.total}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700/50">
                        <p className="text-slate-500 dark:text-slate-300">Đang xử lý</p>
                        <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                          {analyticsSummary.inProgress}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700/50">
                        <p className="text-slate-500 dark:text-slate-300">Hoàn thành</p>
                        <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                          {analyticsSummary.completed}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-300">Tỷ lệ hoàn thành</p>
                      <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                        {analyticsSummary.completionRate.toFixed(0)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-300">Nhắc việc đang có</p>
                      <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                        {analyticsSummary.reminderCount}
                      </p>
                    </div>
                  </div>
                </aside>
              </section>

              <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <OverviewSection tasks={tasks} />
                <TaskChart tasks={tasks} />
              </section>
              </>
            ) : null}

            {activeView === "tools" ? (
              <>
              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Công cụ thao tác
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    Truy cập nhanh các thao tác quản trị thường dùng.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => exportExcel(tasks)}
                      className={secondaryButtonClass}
                    >
                      Xuất Excel (danh sách hiện tại)
                    </button>
                    <button
                      type="button"
                      onClick={() => exportPdf(tasks)}
                      className={secondaryButtonClass}
                    >
                      Xuất PDF (danh sách hiện tại)
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Công cụ chỉ tiêu
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    Chỉnh chỉ tiêu trực tiếp trong tab Analytics để đảm bảo ngữ cảnh dữ liệu.
                  </p>
                  <p className="mt-4 rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                    Mở tab Analytics để xem KPI và cập nhật chỉ tiêu.
                  </p>
                </div>
              </section>

              <LoanRateCard />
              </>
            ) : null}
            </section>
          </section>
        </main>
      </div>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={closeHistory}
        tasks={historyTasks}
        loading={historyLoading}
        onExportExcel={() => exportExcel(historyTasks)}
        onExportPdf={() => exportPdf(historyTasks)}
        onUndoCompleted={undoCompletedTask}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        form={form}
        onChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
        onSubmit={handleTaskModalSubmit}
        taskCount={tasks.length}
        editingTaskId={editingTaskId}
      />

      <TargetEditModal
        isOpen={isTargetModalOpen}
        onClose={closeTargetModal}
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
        onResetOutstandingToStartOfDay={resetOutstandingToStartOfDay}
      />
    </div>
  );
}
