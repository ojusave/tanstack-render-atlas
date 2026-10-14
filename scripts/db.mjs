import pg from "pg";

const { Pool } = pg;

// The local fallback lets someone run the app immediately without installing a database.
// If DATABASE_URL exists, the same functions use PostgreSQL instead.
const memoryTasks = [
  {
    id: "local-1",
    title: "Add a task to see the app respond",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "local-2",
    title: "Mark a task complete when it is finished",
    completed: false,
    createdAt: new Date(Date.now() - 60_000).toISOString(),
  },
];

let pool = null;
let storageMode = "memory";

export async function initializeStore() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set. Using the local in-memory store.");
    return;
  }

  // Hosted PostgreSQL commonly requires TLS. Local PostgreSQL stays plain unless
  // the app is running in production mode.
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

  await pool.query("SELECT 1");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const result = await pool.query("SELECT COUNT(*)::int AS count FROM tasks");
  if (result.rows[0].count === 0) {
    await pool.query(
      "INSERT INTO tasks (title) VALUES ($1), ($2)",
      ["Add a task to see the app respond", "Mark a task complete when it is finished"],
    );
  }

  storageMode = "postgres";
  console.log("Connected to Postgres and prepared tasks.");
}

export function getStorageMode() {
  return storageMode;
}

export async function listTasks() {
  if (!pool) return [...memoryTasks].sort((a, b) => Number(a.completed) - Number(b.completed));
  const result = await pool.query(
    "SELECT id::text, title, completed, created_at AS \"createdAt\" FROM tasks ORDER BY completed ASC, created_at DESC LIMIT 100",
  );
  return result.rows;
}

export async function createTask(title) {
  const cleanedTitle = title.trim();
  if (!cleanedTitle || cleanedTitle.length > 160) {
    throw new Error("A task must contain between 1 and 160 characters.");
  }

  if (!pool) {
    const task = { id: `local-${Date.now()}`, title: cleanedTitle, completed: false, createdAt: new Date().toISOString() };
    memoryTasks.push(task);
    return task;
  }

  const result = await pool.query(
    "INSERT INTO tasks (title) VALUES ($1) RETURNING id::text, title, completed, created_at AS \"createdAt\"",
    [cleanedTitle],
  );
  return result.rows[0];
}

export async function updateTask(id, completed) {
  if (typeof completed !== "boolean") throw new Error("Task completion must be true or false.");

  if (!pool) {
    const task = memoryTasks.find((item) => item.id === id);
    if (task) task.completed = completed;
    return task;
  }

  const result = await pool.query(
    "UPDATE tasks SET completed = $2 WHERE id::text = $1 RETURNING id::text, title, completed, created_at AS \"createdAt\"",
    [id, completed],
  );
  return result.rows[0];
}

export async function deleteTask(id) {
  if (!pool) {
    const index = memoryTasks.findIndex((task) => task.id === id);
    if (index >= 0) memoryTasks.splice(index, 1);
    return;
  }

  await pool.query("DELETE FROM tasks WHERE id::text = $1", [id]);
}
