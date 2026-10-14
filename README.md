# TanStack Render Atlas

<p align="center">
  A small full-stack demo for learning how a TanStack frontend, a Node API, and a Postgres database fit together in one Render Blueprint.
</p>

<p align="center">
  <a href="https://tanstack.com/router/latest"><img src="https://img.shields.io/badge/TanStack-Router-ff4154?logo=react&logoColor=white" alt="TanStack Router" /></a>
  <a href="https://tanstack.com/query/latest"><img src="https://img.shields.io/badge/TanStack-Query-ff4154?logo=react&logoColor=white" alt="TanStack Query" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 20 or newer" /></a>
  <a href="https://render.com/docs/blueprint-spec"><img src="https://img.shields.io/badge/Render-Blueprints-46E3B7?logo=render&logoColor=111111" alt="Render Blueprints" /></a>
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#deploy-from-the-blueprint">Deploy from the Blueprint</a> ·
  <a href="#project-map">Project map</a>
</p>

## What this demonstrates

This repository is a working demo application with three layers:

| Layer | Local implementation | Render implementation | Responsibility |
| --- | --- | --- | --- |
| Frontend | Vite, React, TanStack Router, TanStack Query | Built files served by the web service | Renders the UI and calls the API |
| Backend | Node HTTP server on port `10000` | Render web service | Serves the frontend and handles `/api/*` routes |
| Database | In-memory fallback by default | Managed Render Postgres | Stores the `service_notes` table |

The app includes a small Service Notes feature so you can exercise a real request path: the browser sends a request, the Node API validates it, and the database layer stores or deletes the note.

This repository does not deploy itself and does not call the Render API. The checked-in [`render.yaml`](render.yaml) is a deployment contract that you can review and apply from your Render workspace later.

## Architecture

```text
Browser
  TanStack Router + TanStack Query
        |
        | GET /api/health
        | GET /api/services
        | GET, POST, DELETE /api/notes
        v
Node web service
  serves dist/ and handles the API
        |
        | DATABASE_URL
        v
Postgres
  service_notes table
```

When `DATABASE_URL` is missing, the local server uses an in-memory store. This lets you run the entire frontend and backend without creating a local Postgres database. Data in that fallback store disappears when the server stops.

When you apply the Blueprint in Render, Render provides `DATABASE_URL` to the web service. The backend then uses Postgres and creates the `service_notes` table during startup if it does not already exist.

## Quickstart

### Prerequisites

- Node.js 20 or newer
- Git
- A terminal

You do not need a local Postgres installation or a Render API key for the local quickstart.

### Clone and run the demo

Clone the GitHub repository, enter the project folder, install the dependencies, and start both local servers:

```bash
git clone https://github.com/ojusave/tanstack-render-atlas.git
cd tanstack-render-atlas
npm install
npm run dev
```

`npm run dev` starts:

- Vite at [http://localhost:5173](http://localhost:5173) for the frontend
- The Node API at [http://localhost:10000](http://localhost:10000)

Open [http://localhost:5173](http://localhost:5173). The Overview screen should show the frontend, backend, database fallback, and Blueprint layers.

The terminal output should look similar to this. The exact startup timing can vary:

```text
DATABASE_URL is not set. Using the local in-memory store.
Render full-stack demo listening on port 10000
VITE v6.4.4 ready
➜  Local: http://localhost:5173/
```

### Exercise the full-stack request path

1. Find the **Service notes** section.
2. Enter a note and select **Save note**.
3. Confirm that the new note appears in the list.
4. Select **Remove** and confirm that the note disappears.

The frontend sends each action to `/api/notes`. TanStack Query manages the request state and refreshes the list after a successful mutation. The backend chooses Postgres when `DATABASE_URL` exists and the in-memory fallback otherwise.

### Check the API directly

Keep `npm run dev` running and open a second terminal in the project folder:

```bash
curl http://localhost:10000/api/health
```

With no local database configured, the response is:

```json
{"ok":true,"service":"tanstack-render-atlas","database":"memory"}
```

You can also create a note without the browser:

```bash
curl -X POST http://localhost:10000/api/notes \
  -H 'Content-Type: application/json' \
  -d '{"body":"Created from curl"}'
```

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Reports API and database status |
| `GET` | `/api/services` | Returns the demo service definitions |
| `GET` | `/api/notes` | Lists stored notes |
| `POST` | `/api/notes` | Creates a note from `{ "body": "..." }` |
| `DELETE` | `/api/notes/:id` | Deletes one note by ID |

## Deploy from the Blueprint

Deployment is a separate step that you control from Render. This repository has not been deployed from Codex.

The root [`render.yaml`](render.yaml) declares:

- A paid Render web service named `tanstack-render-atlas`
- A paid Render Postgres database named `tanstack-render-atlas-db`
- A `DATABASE_URL` connection from the database to the web service
- The Node build command, start command, region, and runtime settings

When you are ready to deploy:

1. Open the Render dashboard and create a new Blueprint.
2. Select the GitHub repository `ojusave/tanstack-render-atlas`.
3. Review the services and plans from `render.yaml`.
4. Apply the Blueprint in your Render workspace.
5. Open the web service URL and visit `/api/health`.

After the database connection succeeds, the health response should report `"database":"postgres"`. The Overview screen should then let you create and remove notes backed by Render Postgres.

The Blueprint uses paid plans so the file represents a complete, practical web service plus database example. Review the estimated cost in Render before applying it. No Render resources are created by running this repository locally.

### Environment variables

| Variable | Local behavior | Render behavior |
| --- | --- | --- |
| `DATABASE_URL` | Optional. Missing means the in-memory store is used. | Supplied by the Blueprint from the managed Postgres database. |
| `PORT` | Optional. The server defaults to `10000`. | Render provides the service port environment when the service starts. |
| `NODE_ENV` | Optional during local development. | Set to `production` by `render.yaml`. |

### Stop or clean up

- Stop local development with `Ctrl+C` in the terminal running `npm run dev`.
- If you applied the Blueprint only for testing, delete the Render resources from the Render dashboard when finished.
- Deleting the Postgres database deletes the notes stored in that database. Export anything you need before deleting it.

## Production build check

Build the frontend and TypeScript-check the project:

```bash
npm run build
```

A successful build ends with output similar to:

```text
✓ 248 modules transformed.
✓ built in 808ms
```

To run the built application locally, stop the development server first, then run:

```bash
npm run start
```

Open [http://localhost:10000](http://localhost:10000). The Node server serves the built frontend and the API from one process, which matches the web service shape in `render.yaml`.

## Project map

- [`src/main.tsx`](src/main.tsx) creates the TanStack Query client, the Blueprint context, and the TanStack Router instance.
- [`src/routes.tsx`](src/routes.tsx) defines the Overview and Blueprint review screens.
- [`src/hooks/useBackend.ts`](src/hooks/useBackend.ts) connects the UI to the API with TanStack Query hooks.
- [`src/lib/api.ts`](src/lib/api.ts) defines the browser-side API client.
- [`src/data/sampleBlueprint.ts`](src/data/sampleBlueprint.ts) provides the Blueprint data shown in the review screen.
- [`scripts/dev.mjs`](scripts/dev.mjs) starts the Node API and Vite together for local development.
- [`scripts/server.mjs`](scripts/server.mjs) serves the built frontend and handles the API routes.
- [`scripts/db.mjs`](scripts/db.mjs) chooses Postgres when configured and the in-memory store otherwise.
- [`render.yaml`](render.yaml) is the Render deployment contract.

## Reference documentation

- [Render Blueprint YAML reference](https://render.com/docs/blueprint-spec)
- [Render service types](https://render.com/docs/service-types)
- [TanStack Router documentation](https://tanstack.com/router/latest)
- [TanStack Query documentation](https://tanstack.com/query/latest)

## License

No license has been selected for this demo repository yet.
