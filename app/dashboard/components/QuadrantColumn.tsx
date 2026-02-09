"use client";

import type { Quadrant, QuadrantConfig, Task } from "@/lib/dashboard/types";
import { TaskCard } from "./TaskCard";

type QuadrantColumnProps = {
  quad: QuadrantConfig;
  orderedTasks: Task[];
  draggingTaskId: string | null;
  draggingFromQuadrant: Quadrant | null;
  onMoveToQuadrant: (taskId: string, quadrantId: Quadrant) => void;
  onReorder: (quadrantId: Quadrant, orderedIds: string[]) => void;
  getOrderedQuadrantTasks: (quadrantId: Quadrant) => Task[];
  onToggleCompleted: (task: Task) => void;
  onEdit: (task: Task) => void;
  onRemove: (taskId: string) => void;
  setDraggingTaskId: (id: string | null) => void;
  setDraggingFromQuadrant: (q: Quadrant | null) => void;
};

export function QuadrantColumn({
  quad,
  orderedTasks,
  draggingTaskId,
  draggingFromQuadrant,
  onMoveToQuadrant,
  onReorder,
  getOrderedQuadrantTasks,
  onToggleCompleted,
  onEdit,
  onRemove,
  setDraggingTaskId,
  setDraggingFromQuadrant,
}: QuadrantColumnProps) {
  const handleDropOnTask = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    if (draggingFromQuadrant === quad.id) {
      const orderedIds = getOrderedQuadrantTasks(quad.id).map((t) => t.id);
      const fromIndex = orderedIds.indexOf(taskId);
      const toIndex = orderedIds.indexOf(targetTask.id);
      if (fromIndex === -1 || toIndex === -1) return;
      orderedIds.splice(fromIndex, 1);
      orderedIds.splice(toIndex, 0, taskId);
      onReorder(quad.id, orderedIds);
    } else {
      onMoveToQuadrant(taskId, quad.id);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) onMoveToQuadrant(taskId, quad.id);
      }}
      className={`relative overflow-hidden rounded-2xl border p-5 ${quad.className} ${quad.darkClassName ?? ""}`}
    >
      <span className={`absolute left-0 top-0 h-full w-1.5 ${quad.accent}`} />
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {quad.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-200">
            {quad.subtitle}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${quad.badge} ${quad.darkBadge ?? ""}`}
        >
          {orderedTasks.length} việc
        </span>
      </div>

      <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
        {orderedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isDragging={draggingTaskId === task.id}
            onToggleCompleted={onToggleCompleted}
            onEdit={onEdit}
            onRemove={onRemove}
            onDragStart={(e, task) => {
              setDraggingTaskId(task.id);
              setDraggingFromQuadrant(task.quadrant);
              e.dataTransfer.setData("text/plain", task.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => {
              setDraggingTaskId(null);
              setDraggingFromQuadrant(null);
            }}
            onDrop={handleDropOnTask}
          />
        ))}

        {orderedTasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200/70 bg-white/70 p-4 text-xs text-slate-400 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
            Chưa có công việc nào trong nhóm này.
          </div>
        )}
      </div>
    </div>
  );
}
