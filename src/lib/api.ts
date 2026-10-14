export type ServiceStatus = {
  id: string;
  name: string;
  kind: string;
  status: string;
};

export type Note = {
  id: string;
  body: string;
  createdAt: string;
};

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

export async function fetchServices() {
  const response = await request<{ services: ServiceStatus[] }>("/api/services");
  return response.services;
}

export async function fetchNotes() {
  const response = await request<{ notes: Note[] }>("/api/notes");
  return response.notes;
}

export function createNote(body: string) {
  return request<{ note: Note }>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function removeNote(id: string) {
  return request<void>(`/api/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
}
