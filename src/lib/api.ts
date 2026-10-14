// A task is the small piece of data shared by the browser, API, and database.
export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

// The health response lets the UI explain whether the backend is reachable and
// which storage mode is active on this machine.
export type Health = {
  ok: boolean;
  service: string;
  database: "memory" | "postgres";
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.error === "string" ? body.error : `Request failed with status ${response.status}.`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export function fetchHealth() {
  return request<Health>("/api/health");
}

export async function fetchTasks() {
  const response = await request<{ tasks: Task[] }>("/api/tasks");
  return response.tasks;
}

export function createTask(title: string) {
  return request<{ task: Task }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function toggleTask({ id, completed }: { id: string; completed: boolean }) {
  return request<{ task: Task }>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export function deleteTask(id: string) {
  return request<void>(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
}
