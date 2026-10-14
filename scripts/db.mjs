import pg from "pg";

const { Pool } = pg;

// The local fallback lets a new reader run the app before creating a database.
// On Render, DATABASE_URL is injected by the Blueprint and the same API uses Postgres.
const memoryNotes = [
  {
    id: "local-1",
    body: "The browser talks to the Node API, then the API talks to the database.",
    createdAt: new Date().toISOString(),
  },
];

let pool = null;
let storageMode = "memory";

export async function initializeStore() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set. Using the local in-memory store.");
    return;
  }

  // Render Postgres accepts TLS connections. Local PostgreSQL can still work by
  // setting NODE_ENV to development, which keeps the SSL option disabled.
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

  await pool.query("SELECT 1");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_notes (
      id BIGSERIAL PRIMARY KEY,
      body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 240),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const result = await pool.query("SELECT COUNT(*)::int AS count FROM service_notes");
  if (result.rows[0].count === 0) {
    await pool.query(
      "INSERT INTO service_notes (body) VALUES ($1)",
      ["The browser talks to the Node API, then the API talks to the database."],
    );
  }

  storageMode = "postgres";
  console.log("Connected to Postgres and prepared service_notes.");
}

export function getStorageMode() {
  return storageMode;
}

export async function listNotes() {
  if (!pool) return [...memoryNotes].reverse();
  const result = await pool.query(
    "SELECT id::text, body, created_at AS \"createdAt\" FROM service_notes ORDER BY created_at DESC LIMIT 20",
  );
  return result.rows;
}

export async function createNote(body) {
  const cleanedBody = body.trim();
  if (!cleanedBody || cleanedBody.length > 240) {
    throw new Error("A note must contain between 1 and 240 characters.");
  }

  if (!pool) {
    const note = { id: `local-${Date.now()}`, body: cleanedBody, createdAt: new Date().toISOString() };
    memoryNotes.push(note);
    return note;
  }

  const result = await pool.query(
    "INSERT INTO service_notes (body) VALUES ($1) RETURNING id::text, body, created_at AS \"createdAt\"",
    [cleanedBody],
  );
  return result.rows[0];
}

export async function deleteNote(id) {
  if (!pool) {
    const index = memoryNotes.findIndex((note) => note.id === id);
    if (index >= 0) memoryNotes.splice(index, 1);
    return;
  }

  await pool.query("DELETE FROM service_notes WHERE id::text = $1", [id]);
}
