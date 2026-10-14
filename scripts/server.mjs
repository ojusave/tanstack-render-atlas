import { createReadStream, existsSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { createNote, deleteNote, getStorageMode, initializeStore, listNotes } from "./db.mjs";

// This tiny server makes the built TanStack app runnable as a paid Render web
// or private service. It is intentionally small so the deployment boundary is easy to see.
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const publicRoot = join(projectRoot, "dist");
const port = Number(process.env.PORT ?? 10000);

// The backend owns these service facts. The frontend reads them through the API
// instead of hard-coding a health message that could drift from reality.
const serviceManifest = [
  { id: "frontend", name: "TanStack frontend", kind: "browser", status: "ready" },
  { id: "backend", name: "Node API", kind: "web", status: "ready" },
  { id: "database", name: "Render Postgres", kind: "database", status: "waiting" },
];

function safePath(requestUrl) {
  // Only serve files below dist. A missing file falls back to the app shell so
  // TanStack Router can handle browser routes such as /blueprint.
  const requestPath = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const candidate = normalize(join(publicRoot, requestPath));
  return candidate.startsWith(publicRoot) ? candidate : join(publicRoot, "index.html");
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error);
    sendJson(response, 500, { error: "The backend could not complete that request." });
  });
});

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  if (body.length > 10_000) throw new Error("Request body is too large.");
  return body ? JSON.parse(body) : {};
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");

  if (requestUrl.pathname === "/health" || requestUrl.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, service: "tanstack-render-atlas", database: getStorageMode() });
    return;
  }

  if (requestUrl.pathname === "/api/services" && request.method === "GET") {
    sendJson(response, 200, {
      services: serviceManifest.map((service) => ({ ...service, status: service.id === "database" ? getStorageMode() : service.status })),
    });
    return;
  }

  if (requestUrl.pathname === "/api/notes" && request.method === "GET") {
    sendJson(response, 200, { notes: await listNotes() });
    return;
  }

  if (requestUrl.pathname === "/api/notes" && request.method === "POST") {
    const body = await readJsonBody(request);
    sendJson(response, 201, { note: await createNote(typeof body.body === "string" ? body.body : "") });
    return;
  }

  const noteMatch = requestUrl.pathname.match(/^\/api\/notes\/([^/]+)$/);
  if (noteMatch && request.method === "DELETE") {
    await deleteNote(noteMatch[1]);
    response.writeHead(204);
    response.end();
    return;
  }

  const requestedFile = safePath(request.url ?? "/");
  const filePath = existsSync(requestedFile) && statSync(requestedFile).isFile() ? requestedFile : join(publicRoot, "index.html");
  const contentType = filePath.endsWith(".js") ? "text/javascript" : filePath.endsWith(".css") ? "text/css" : "text/html";

  response.writeHead(200, { "content-type": `${contentType}; charset=utf-8` });
  createReadStream(filePath).pipe(response);
}

await initializeStore();
server.listen(port, "0.0.0.0", () => {
  console.log(`Render full-stack demo listening on port ${port}`);
});
