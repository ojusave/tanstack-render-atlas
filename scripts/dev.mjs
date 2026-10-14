import { spawn } from "node:child_process";

// One command starts both halves of the local app so a beginner does not have
// to remember two terminals. Vite serves the frontend, and Node serves the API.
const commands = [
  [process.execPath, ["scripts/server.mjs"]],
  [process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"]],
];

const children = commands.map(([command, args]) => spawn(command, args, { stdio: "inherit" }));

function stopChildren() {
  // Ctrl+C should stop both processes so the local ports are released cleanly.
  for (const child of children) child.kill("SIGTERM");
}

process.on("SIGINT", stopChildren);
process.on("SIGTERM", stopChildren);
