"use client";

import type { Quadrant, Task } from "@/lib/dashboard/types";
import { quadrants } from "@/lib/dashboard/types";
import { QuadrantColumn } from "./QuadrantColumn";

type EisenhowerSectionProps = {
  tasks: Task[];
  getOrderedQuadrantTasks: (quadrantId: Quadrant) => Task[];
  draggingTaskId: string | null;
  draggingFromQuadrant: Quadrant | null;
  onMoveToQuadrant: (taskId: string, quadrantId: Quadrant) => void;
  onReorder: (quadrantId: Quadrant, orderedIds: string[]) => void;
  onToggleCompleted: (task: Task) => void;
  onEdit: (task: Task) => void;
  onRemove: (taskId: string) => void;
  setDraggingTaskId: (id: string | null) => void;
  setDraggingFromQuadrant: (q: Quadrant | null) => void;
};

export function EisenhowerSection({
  tasks,
  getOrderedQuadrantTasks,
  draggingTaskId,
  draggingFromQuadrant,
  onMoveToQuadrant,
  onReorder,
  onToggleCompleted,
  onEdit,
  onRemove,
  setDraggingTaskId,
  setDraggingFromQuadrant,
}: EisenhowerSectionProps) {
  return (
    <section id="tasks">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Ma trận Eisenhower
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-200">
          Thẻ công việc có màu theo mức ưu tiên
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {quadrants.map((quad) => (
          <QuadrantColumn
            key={quad.id}
            quad={quad}
            orderedTasks={getOrderedQuadrantTasks(quad.id)}
            draggingTaskId={draggingTaskId}
            draggingFromQuadrant={draggingFromQuadrant}
            onMoveToQuadrant={onMoveToQuadrant}
            onReorder={onReorder}
            getOrderedQuadrantTasks={getOrderedQuadrantTasks}
            onToggleCompleted={onToggleCompleted}
            onEdit={onEdit}
            onRemove={onRemove}
            setDraggingTaskId={setDraggingTaskId}
            setDraggingFromQuadrant={setDraggingFromQuadrant}
          />
        ))}
      </div>
    </section>
  );
}
