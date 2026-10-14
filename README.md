# TanStack Render Atlas

TanStack Render Atlas is a small full-stack demo that gives you one frontend, one backend, and one database path to deploy from a Render Blueprint. The browser uses TanStack Router and TanStack Query, the Node server serves the UI and API, and the API stores service notes in Postgres when `DATABASE_URL` is present.

This repository is local code plus a deployment contract. It does not call the Render API or deploy anything. You create the Blueprint from `render.yaml` in your Render workspace when you choose to deploy it.

## What you will run

```text
Browser: TanStack Router + TanStack Query
    |
    | fetch /api/health, /api/services, /api/notes
    v
Node web service: serves dist/ and handles the API
    |
    | DATABASE_URL
    v
Render Postgres: stores service_notes
```

The local app uses an in-memory fallback when `DATABASE_URL` is missing. That keeps the frontend and backend usable before you create a database. The Render Blueprint wires `DATABASE_URL` to the managed Postgres connection string.

## Quickstart

Prerequisites:

- Node.js 20 or newer
- A terminal opened in this project folder

From `/Users/ojusave/Downloads/Samples/tanstack-render-blueprint-studio`, run:

```bash
npm install
npm run dev
```

The `dev` command starts Vite on `http://localhost:5173` and the Node API on port `10000`. Open the Vite URL. The Overview page should show the browser, Node API, and local database fallback as three connected layers.

## Exercise the full-stack path

1. Open the **Service notes** section.
2. Add a note and click **Save note**.
3. Confirm the note appears in the list.
4. Click **Remove** to send a delete request through the same API.

The frontend calls `/api/notes`. The Node backend validates the body and writes to Postgres when configured. Without a database, it uses the local fallback and prints that choice in the server terminal.

## Create the Render Blueprint later

The checked-in [`render.yaml`](render.yaml) declares:

- One paid Render web service named `tanstack-render-atlas`
- A paid Render Postgres database named `tanstack-render-atlas-db`
- A `DATABASE_URL` connection from the database to the web service
- A Node build command and start command

When you are ready, connect this GitHub repository in Render and create a Blueprint from `render.yaml`. That deployment step is intentionally outside this project and has not been run by this demo.

## Project map

- [`src/main.tsx`](src/main.tsx) starts TanStack Router and TanStack Query.
- [`src/routes.tsx`](src/routes.tsx) defines the app overview and Blueprint review screens.
- [`src/hooks/useBackend.ts`](src/hooks/useBackend.ts) connects the UI to the backend with TanStack Query.
- [`src/lib/api.ts`](src/lib/api.ts) defines the browser API client.
- [`scripts/server.mjs`](scripts/server.mjs) serves the built frontend and handles `/api/*` routes.
- [`scripts/db.mjs`](scripts/db.mjs) chooses Postgres on Render and memory locally.
- [`render.yaml`](render.yaml) is the deployment contract you will use later.

## Checks

Run the production build:

```bash
npm run build
```

Run the built Node service directly after building:

```bash
npm run start
```

In another terminal, check the backend:

```bash
curl http://localhost:10000/api/health
```

Without `DATABASE_URL`, the response includes `"database":"memory"`. On Render, the Blueprint supplies `DATABASE_URL`, so the response should report `"database":"postgres"` after the database connection succeeds.

## References

The Blueprint shape follows Render's [Blueprint YAML reference](https://render.com/docs/blueprint-spec) and [service types guide](https://render.com/docs/service-types). The frontend uses [TanStack Router](https://tanstack.com/router/latest) and [TanStack Query](https://tanstack.com/query/latest).
