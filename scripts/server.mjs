import { createReadStream, existsSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { createTask, deleteTask, getStorageMode, initializeStore, listTasks, updateTask } from "./db.mjs";

// This small server gives the browser a real API and serves the built React app.
// Keeping both pieces in one process makes the local project easy to run.
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const publicRoot = join(projectRoot, "dist");
const port = Number(process.env.PORT ?? 10000);

function safePath(requestUrl) {
  // Only serve files below dist. A missing file falls back to the app shell so
  // the browser can still load the React app at its root route.
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
    sendJson(response, 200, { ok: true, service: "focus-board", database: getStorageMode() });
    return;
  }

  if (requestUrl.pathname === "/api/tasks" && request.method === "GET") {
    sendJson(response, 200, { tasks: await listTasks() });
    return;
  }

  if (requestUrl.pathname === "/api/tasks" && request.method === "POST") {
    const body = await readJsonBody(request);
    sendJson(response, 201, { task: await createTask(typeof body.title === "string" ? body.title : "") });
    return;
  }

  const taskMatch = requestUrl.pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (taskMatch && request.method === "PATCH") {
    const body = await readJsonBody(request);
    const task = await updateTask(taskMatch[1], body.completed);
    if (!task) {
      sendJson(response, 404, { error: "Task not found." });
      return;
    }
    sendJson(response, 200, { task });
    return;
  }

  if (taskMatch && request.method === "DELETE") {
    await deleteTask(taskMatch[1]);
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
  console.log(`Focus Board listening on port ${port}`);
});
