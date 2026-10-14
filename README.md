# Focus Board

Start here by running Focus Board locally. This repository contains the application itself. It does not include a Blueprint file and it does not deploy anything.

Focus Board is a small task list with a React frontend using TanStack Router and TanStack Query, a Node backend, and a database layer that uses temporary memory locally or PostgreSQL when `DATABASE_URL` is configured.

The app is intentionally straightforward: add a task, mark it complete, filter the list, or delete a task. You can add a Render Blueprint file later when you are ready to describe how the app should run in the cloud.

## What the app contains

| Part | What it does |
| --- | --- |
| Frontend | Displays the task list and sends user actions to the API |
| TanStack Query | Loads tasks, tracks requests, and refreshes the list after changes |
| Node backend | Serves the API and the built frontend |
| Database layer | Uses memory locally, or PostgreSQL when `DATABASE_URL` exists |

The request path is:

```text
Browser
  React + TanStack Router + TanStack Query
        |
        | /api/tasks
        v
Node backend
        |
        | database connection
        v
Memory locally or PostgreSQL
```

## Quickstart

### Prerequisites

- Node.js 20 or newer
- Git
- A terminal

You do not need to install PostgreSQL to run the app locally.

### Run the app

Clone the repository, enter the project folder, install the dependencies, and start the local frontend and backend:

```bash
git clone https://github.com/ojusave/tanstack-render-atlas.git
cd tanstack-render-atlas
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

You should see the Focus Board task list with two starter tasks and an **API connected** status. If the page does not load, confirm that the terminal running `npm run dev` is still open.

The command starts:

- The frontend at `http://127.0.0.1:5173`
- The backend at `http://127.0.0.1:10000`

The terminal should contain output similar to:

```text
DATABASE_URL is not set. Using the local in-memory store.
Focus Board listening on port 10000
VITE v6.4.4 ready
➜  Local: http://127.0.0.1:5173/
```

### Use the app

1. Enter a task in **What needs doing?**.
2. Select **Add task**.
3. Select the checkbox to mark the task complete.
4. Use **All**, **Open**, or **Done** to filter the list.
5. Select **Delete** to remove a task.

These actions go through the Node API. With no `DATABASE_URL`, the data is stored in memory and resets when the backend restarts.

Stop both local servers with `Ctrl+C` in the terminal running `npm run dev`.

## API routes

The backend listens on port `10000` during local development.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Reports backend and storage status |
| `GET` | `/api/tasks` | Returns the task list |
| `POST` | `/api/tasks` | Creates a task from `{ "title": "..." }` |
| `PATCH` | `/api/tasks/:id` | Updates completion from `{ "completed": true }` |
| `DELETE` | `/api/tasks/:id` | Deletes a task |

Check the backend directly:

```bash
curl http://127.0.0.1:10000/api/health
```

Local output includes:

```json
{"ok":true,"service":"focus-board","database":"memory"}
```

## Database behavior

The app has two storage modes:

- Without `DATABASE_URL`, the backend uses an in-memory task list. This keeps local setup short and requires no database account.
- With `DATABASE_URL`, the backend connects to PostgreSQL, creates a `tasks` table if needed, and stores tasks there.

The `PORT` environment variable can change the backend port. If it is not set, the backend uses `10000`.

## Build and run the production shape

Build the TypeScript and frontend bundle:

```bash
npm run build
```

Run the built application:

```bash
npm run start
```

The Node server then serves both the built frontend and the API from port `10000`.

A successful build ends with output similar to:

```text
✓ 170 modules transformed.
✓ built in 663ms
```

The build time can vary between machines.

## Add a Blueprint later

This repository intentionally does not include a `render.yaml` file. When you are ready to describe the cloud resources, add your own Blueprint file at the repository root.

The file will typically define the web service, its build and start commands, the database, and the environment variable that connects the backend to PostgreSQL. Review that file before applying it in Render. Running this project locally does not create or change Render resources.

Do not add deployment settings to the app until the local task flow works. When you are ready, commit the Blueprint separately so the application code and infrastructure choices remain easy to review.

## Troubleshooting

### Port `10000` or `5173` is already in use

Stop the other local development process, then run `npm run dev` again. The backend uses port `10000` and the Vite frontend uses port `5173` by default.

### The page says the API is offline

Keep the terminal running `npm run dev` open. The frontend calls the Node backend at `http://127.0.0.1:10000`. Check the terminal for the first error, then refresh the browser after the backend starts.

### Tasks disappear after a restart

That is expected when `DATABASE_URL` is not set. The local fallback keeps setup simple, but it is temporary. Configure PostgreSQL later when you need persistent data.

## Project map

- [`src/main.tsx`](src/main.tsx) starts TanStack Router and TanStack Query.
- [`src/routes.tsx`](src/routes.tsx) defines the task screen and its user interactions.
- [`src/hooks/useBackend.ts`](src/hooks/useBackend.ts) connects React components to backend requests with TanStack Query.
- [`src/lib/api.ts`](src/lib/api.ts) defines the browser API client and shared response types.
- [`scripts/dev.mjs`](scripts/dev.mjs) starts the frontend and backend together.
- [`scripts/server.mjs`](scripts/server.mjs) serves the frontend and handles API requests.
- [`scripts/db.mjs`](scripts/db.mjs) chooses memory or PostgreSQL storage.

## License

No license has been selected for this repository yet.
