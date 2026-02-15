type JsonObject = Record<string, unknown>;

const requestOk = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response;
};

export const saveTaskApi = async (
  editingTaskId: string | null,
  payload: JsonObject
) => {
  const isEditing = Boolean(editingTaskId);
  const url = isEditing ? `/api/tasks/${editingTaskId}` : "/api/tasks";
  const method = isEditing ? "PUT" : "POST";
  await requestOk(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export const deleteTaskApi = async (taskId: string) => {
  await requestOk(`/api/tasks/${taskId}`, { method: "DELETE" });
};

export const toggleTaskCompletedApi = async (
  taskId: string,
  completed: boolean
) => {
  await requestOk(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
};

export const undoTaskCompletedApi = async (taskId: string) => {
  await toggleTaskCompletedApi(taskId, false);
};

export const moveTaskToQuadrantApi = async (
  taskId: string,
  quadrant: string
) => {
  await requestOk(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quadrant }),
  });
};

export const reorderWithinQuadrantApi = async (
  quadrant: string,
  orderedIds: string[]
) => {
  await requestOk("/api/tasks/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quadrant, orderedIds }),
  });
};
