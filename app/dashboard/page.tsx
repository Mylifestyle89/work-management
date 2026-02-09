"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Banknote, Target } from "lucide-react";
import {
  type Task,
  type Quadrant,
  type TargetKey,
  type TargetValues,
  defaultTargets,
  TARGETS_STORAGE_KEY,
} from "@/lib/dashboard/types";
import {
  formatCurrency,
  formatDate,
  escapeCsvValue,
  createId,
} from "@/lib/dashboard/utils";
import {
  Sidebar,
  Header,
  ProgressCards,
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

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalsFromApi, setTotalsFromApi] = useState<TasksResponse["totals"] | null>(null);
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [form, setForm] = useState<TaskFormState>(initialFormState);
  const [targetValues, setTargetValues] = useState<TargetValues>(defaultTargets);
  const [editingTarget, setEditingTarget] = useState<TargetKey | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingFromQuadrant, setDraggingFromQuadrant] =
    useState<Quadrant | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) return;
      const data = (await response.json()) as TasksResponse;
      setTasks(data.tasks);
      setTotalsFromApi(data.totals);
    } catch (error) {
      console.error("Không thể tải dữ liệu công việc", error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!isHistoryOpen) return;
    setHistoryLoading(true);
    fetch("/api/tasks?includeArchived=true")
      .then((r) => r.json())
      .then((d: TasksResponse) => {
        setHistoryTasks(d.tasks);
        setHistoryLoading(false);
      })
      .catch(() => setHistoryLoading(false));
  }, [isHistoryOpen]);

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

  const totals = useMemo(() => {
    if (totalsFromApi) return totalsFromApi;
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
  }, [totalsFromApi, tasks]);

  const progressCards = useMemo(
    () => [
      {
        key: "outstanding" as const,
        title: "Dư nợ thuần",
        icon: Banknote,
        value: totals.netOutstanding,
        target: targetValues.outstanding,
      },
      {
        key: "mobilized" as const,
        title: "Huy động vốn",
        icon: Target,
        value: totals.totalMobilized,
        target: targetValues.mobilized,
      },
      {
        key: "serviceFee" as const,
        title: "Phí dịch vụ",
        icon: BadgeDollarSign,
        value: totals.totalServiceFee,
        target: targetValues.serviceFee,
      },
    ],
    [totals, targetValues]
  );

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

  const exportCsv = (tasksToExport: Task[] = tasks) => {
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
    const rows = tasksToExport.map((task) => [
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
        <Sidebar />
        <main className="flex-1 space-y-8 px-6 py-8 lg:px-10">
          <Header
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenTaskModal={() => setIsTaskModalOpen(true)}
          />

          <ProgressCards
            cards={progressCards}
            editingTarget={editingTarget}
            onEditingTargetChange={setEditingTarget}
            targetValues={targetValues}
            onTargetValuesChange={setTargetValues}
          />

          <section
            id="overview"
            className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <OverviewSection tasks={tasks} />
            <TaskChart tasks={tasks} />
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
        </main>
      </div>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        tasks={historyTasks}
        loading={historyLoading}
        onExportCsv={() => exportCsv(historyTasks)}
        onExportPdf={() => exportPdf(historyTasks)}
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
    </div>
  );
}
