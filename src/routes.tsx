import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import { Icon } from "./components/Icons";
import { useBlueprint } from "./state/useBlueprint";
import { getResourceLabel, countReferences, type BlueprintEntry, type BlueprintResourceKind } from "./lib/blueprint";
import { useCreateNote, useHealth, useNotes, useRemoveNote, useServices } from "./hooks/useBackend";
import type { ServiceStatus } from "./lib/api";

function ResourceGlyph({ kind }: { kind: BlueprintResourceKind }) {
  // A short visual marker makes a dense resource list scannable without hiding meaning in color alone.
  const glyph = kind === "postgres" ? <Icon name="database" /> : kind === "keyvalue" ? "KV" : kind === "static" ? "CDN" : kind === "private" ? "PS" : kind === "worker" ? "WK" : kind === "cron" ? "CR" : "WS";
  return <span className={`resource-glyph resource-glyph-${kind}`}>{glyph}</span>;
}

function StatusPill({ children, tone = "green" }: { children: string; tone?: "green" | "orange" | "muted" }) {
  return <span className={`status-pill status-pill-${tone}`}><span className="status-dot" />{children}</span>;
}

function ServiceCard({ entry, selected, onSelect }: { entry: BlueprintEntry; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`service-card ${selected ? "service-card-selected" : ""}`} onClick={onSelect} type="button">
      <div className="service-card-topline">
        <ResourceGlyph kind={entry.type} />
        <span className="service-card-kind">{getResourceLabel(entry.type)}</span>
        <span className="service-card-check"><Icon name="check" /></span>
      </div>
      <strong>{entry.name}</strong>
      <span className="service-card-meta">{entry.plan ?? "Global CDN"} <span>·</span> {entry.region ?? "managed"}</span>
      <span className="service-card-action">Inspect details <Icon name="arrow" /></span>
    </button>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="stat-block">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <span className="stat-detail">{detail}</span>
    </div>
  );
}

function RootLayout() {
  const { parsed, sourceName, resetSample, downloadBlueprint } = useBlueprint();
  const serviceCount = parsed.services.length + parsed.databases.length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /> <span /> <span /></div>
          <div>
            <strong>Render Atlas</strong>
            <span>TanStack × Render</span>
          </div>
        </div>

        <div className="sidebar-label">Workspace</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <Link to="/" activeOptions={{ exact: true }} className="nav-link">
            <span className="nav-icon"><Icon name="layers" /></span>
            <span>Overview</span>
            <span className="nav-count">{serviceCount}</span>
          </Link>
          <Link to="/blueprint" className="nav-link">
            <span className="nav-icon"><Icon name="file" /></span>
            <span>Render Blueprint</span>
          </Link>
        </nav>

        <div className="sidebar-divider" />
        <div className="sidebar-label">Reference</div>
        <div className="reference-list">
          <div><span className="reference-line reference-line-orange" />Service types</div>
          <div><span className="reference-line reference-line-mint" />Connections</div>
          <div><span className="reference-line reference-line-blue" />Blueprint YAML</div>
        </div>

        <div className="sidebar-bottom">
          <div className="local-note">
            <span className="local-note-icon"><Icon name="box" /></span>
            <div><strong>Local full-stack demo</strong><span>No Render deployment happens here.</span></div>
          </div>
          <div className="sidebar-footer">Frontend, backend, database, one Blueprint.</div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" /><strong>{sourceName}</strong></div>
          <div className="topbar-actions">
            <button className="button button-ghost" type="button" onClick={resetSample}><Icon name="refresh" />Reset sample</button>
            <button className="button button-dark" type="button" onClick={downloadBlueprint}><Icon name="download" />Download Blueprint</button>
          </div>
        </header>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}

function ArchitectureGlyph({ kind }: { kind: string }) {
  const content = kind === "database" ? <Icon name="database" /> : kind === "browser" ? "UI" : "API";
  return <span className={`architecture-glyph architecture-glyph-${kind}`}>{content}</span>;
}

function ArchitectureCard({ service }: { service: ServiceStatus }) {
  const isDatabase = service.kind === "database";
  const statusLabel = isDatabase ? (service.status === "postgres" ? "Postgres connected" : "Local fallback") : "Ready";
  return (
    <div className="architecture-card">
      <div className="architecture-card-topline"><ArchitectureGlyph kind={service.kind} /><StatusPill tone={isDatabase && service.status !== "postgres" ? "orange" : "green"}>{statusLabel}</StatusPill></div>
      <strong>{service.name}</strong>
      <span>{isDatabase ? "Persists notes and app data" : service.kind === "browser" ? "TanStack Router + Query" : "Serves the UI and /api routes"}</span>
    </div>
  );
}

function NotesPanel() {
  const [draft, setDraft] = useState("");
  const notes = useNotes();
  const create = useCreateNote();
  const remove = useRemoveNote();

  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    create.mutate(draft, { onSuccess: () => setDraft("") });
  }

  return (
    <section className="notes-panel">
      <div className="panel-header"><div><span className="eyebrow">Real backend data</span><h2>Service notes</h2></div><span className="panel-index">POSTGRES</span></div>
      <p className="panel-copy">Add a note to exercise the browser to API to database path. With no `DATABASE_URL`, the local server uses memory so the demo still starts.</p>
      <form className="note-form" onSubmit={submitNote}>
        <label className="visually-hidden" htmlFor="service-note">New service note</label>
        <input id="service-note" maxLength={240} placeholder="What should the next deploy remember?" value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button className="button button-orange" type="submit" disabled={create.isPending}><Icon name="plus" />{create.isPending ? "Saving" : "Save note"}</button>
      </form>
      {notes.isError || create.isError || remove.isError ? <div className="api-error">The API returned an error. Check the local Node server output.</div> : null}
      <div className="notes-list">
        {notes.isPending ? <div className="notes-empty">Loading notes from the backend...</div> : null}
        {notes.data?.map((note) => <div className="note-row" key={note.id}><div><strong>{note.body}</strong><small>{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(note.createdAt))}</small></div><button className="note-delete" type="button" onClick={() => remove.mutate(note.id)}>Remove</button></div>)}
        {notes.data?.length === 0 ? <div className="notes-empty">No notes yet. Add the first one above.</div> : null}
      </div>
    </section>
  );
}

function OverviewPage() {
  const { parsed, selectedId, setSelectedId } = useBlueprint();
  const health = useHealth();
  const services = useServices();
  const entries = [...parsed.services, ...parsed.databases];
  const references = countReferences(parsed.services);
  const architecture = services.data ?? [
    { id: "frontend", name: "TanStack frontend", kind: "browser", status: "ready" },
    { id: "backend", name: "Node API", kind: "web", status: "ready" },
    { id: "database", name: "Render Postgres", kind: "database", status: "waiting" },
  ];
  const heroStatus = health.isError ? "Backend offline" : health.isPending ? "Checking backend" : health.data?.database === "postgres" ? "Backend + Postgres ready" : "Backend ready locally";

  return (
    <div className="page page-overview">
      <section className="hero-block">
        <div>
          <div className="overline"><span className="overline-rule" />A small full-stack service</div>
          <h1>Three layers,<br /><em>one clear path.</em></h1>
          <p className="hero-copy">A TanStack frontend talks to a Node backend. The backend owns the data path, and Render Postgres is ready to persist it when you deploy from the Blueprint.</p>
        </div>
        <div className="hero-side-note">
          <StatusPill tone={health.isError ? "orange" : "green"}>{heroStatus}</StatusPill>
          <span>This screen is talking to the local API. Nothing is deployed from the app.</span>
          <Link to="/blueprint" className="text-link">Open the Blueprint <Icon name="arrow" /></Link>
        </div>
      </section>

      <section className="stat-strip" aria-label="Application summary">
        <Stat label="Frontend" value="READY" detail="TanStack Router + Query" />
        <Stat label="Backend" value={health.isError ? "OFFLINE" : "READY"} detail="Node API under /api" />
        <Stat label="Database" value={health.data?.database === "postgres" ? "PG" : "LOCAL"} detail={health.data?.database === "postgres" ? "Render Postgres" : "memory fallback"} />
        <Stat label="Blueprint" value={String(entries.length).padStart(2, "0")} detail={`${references} data connection`} />
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">Runtime architecture</span><h2>What will run on Render</h2></div><span className="section-caption">The same app works locally before deployment.</span></div>
        <div className="architecture-grid">{architecture.map((service) => <ArchitectureCard key={service.id} service={service} />)}</div>
      </section>

      <NotesPanel />

      <section className="connection-band">
        <div className="connection-band-copy">
          <span className="eyebrow">The deployment handoff</span>
          <h2>Code first.<br />Blueprint second.</h2>
          <p>Review the checked-in `render.yaml`, connect the repository in Render, and let the Blueprint provide `DATABASE_URL` to the Node service. This project does not deploy itself.</p>
          <Link to="/blueprint" className="button button-orange">Review render.yaml <Icon name="arrow" /></Link>
        </div>
        <div className="connection-diagram" aria-label="Browser to Node API to Postgres">
          <div className="diagram-node diagram-node-web"><ArchitectureGlyph kind="browser" /><span>browser</span></div>
          <div className="diagram-arrow"><span>HTTP /api</span><Icon name="arrow" /></div>
          <div className="diagram-node diagram-node-db"><ArchitectureGlyph kind="web" /><span>node api</span></div>
          <div className="diagram-arrow diagram-arrow-lower"><span>DATABASE_URL</span><Icon name="arrow" /></div>
          <div className="diagram-node diagram-node-kv"><ArchitectureGlyph kind="database" /><span>postgres</span></div>
        </div>
      </section>

      <section className="section-block blueprint-preview-block">
        <div className="section-heading"><div><span className="eyebrow">Blueprint resources</span><h2>What the YAML declares</h2></div><span className="section-caption">Select one to inspect its fields.</span></div>
        <div className="service-grid">{entries.map((entry) => <ServiceCard key={entry.id} entry={entry} selected={selectedId === entry.id} onSelect={() => setSelectedId(entry.id)} />)}</div>
      </section>
    </div>
  );
}

function ResourceInspector({ entry }: { entry: BlueprintEntry | undefined }) {
  if (!entry) {
    return <div className="empty-inspector"><Icon name="box" /><strong>Select a resource</strong><span>Its Blueprint fields will appear here.</span></div>;
  }

  return (
    <div className="inspector-content">
      <div className="inspector-title-row"><ResourceGlyph kind={entry.type} /><div><span className="eyebrow">{getResourceLabel(entry.type)}</span><h3>{entry.name}</h3></div></div>
      <StatusPill>Blueprint-ready</StatusPill>
      <dl className="detail-list">
        <div><dt>Blueprint type</dt><dd>{entry.rawType}</dd></div>
        <div><dt>Runtime</dt><dd>{entry.runtime ?? "managed"}</dd></div>
        <div><dt>Plan</dt><dd>{entry.plan ?? "global CDN"}</dd></div>
        <div><dt>Region</dt><dd>{entry.region ?? "global"}</dd></div>
        {entry.schedule ? <div><dt>Schedule</dt><dd>{entry.schedule}</dd></div> : null}
      </dl>
      <div className="inspector-command">
        <span className="eyebrow">Start command</span>
        <code>{entry.startCommand ?? "No start command in this resource"}</code>
      </div>
      {entry.envVars.length > 0 ? <div className="inspector-env"><span className="eyebrow">Environment links</span>{entry.envVars.map((env, index) => <span className="env-chip" key={`${entry.id}-env-${index}`}>{String(env.key ?? "linked value")}</span>)}</div> : null}
    </div>
  );
}

function BlueprintPage() {
  const { rawYaml, parsed, parseError, selectedId, setSelectedId, loadYaml, downloadBlueprint } = useBlueprint();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const entries = [...parsed.services, ...parsed.databases];
  const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0];

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    loadYaml(await file.text(), file.name);
    event.target.value = "";
  }

  async function copyYaml() {
    await navigator.clipboard.writeText(rawYaml);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="page page-blueprint">
      <section className="page-heading-row">
        <div><div className="overline"><span className="overline-rule" />Source of truth</div><h1>Edit the Blueprint,<br /><em>keep the context.</em></h1></div>
        <div className="page-heading-actions">
          <input ref={fileInputRef} className="visually-hidden" type="file" accept=".yaml,.yml,text/yaml" onChange={importFile} />
          <button className="button button-ghost" type="button" onClick={() => fileInputRef.current?.click()}><Icon name="upload" />Import render.yaml</button>
          <button className="button button-dark" type="button" onClick={downloadBlueprint}><Icon name="download" />Download render.yaml</button>
        </div>
      </section>

      <section className="editor-layout">
        <div className="panel yaml-panel">
          <div className="panel-header">
            <div><span className="eyebrow">Blueprint file</span><h2>render.yaml</h2></div>
            <button className="icon-button" aria-label={copied ? "Copied YAML" : "Copy YAML"} title={copied ? "Copied" : "Copy YAML"} type="button" onClick={copyYaml}><Icon name={copied ? "check" : "copy"} /></button>
          </div>
          <textarea aria-label="Blueprint YAML editor" className="yaml-editor" spellCheck="false" value={rawYaml} onChange={(event) => loadYaml(event.target.value, "local draft")} />
          <div className={`editor-status ${parseError ? "editor-status-error" : ""}`}>
            <span className="editor-status-icon"><Icon name={parseError ? "box" : "check"} /></span>
            <span>{parseError ?? `${entries.length} resources recognized. This demo checks YAML shape, not the full Render schema.`}</span>
          </div>
        </div>

        <aside className="panel inspector-panel">
          <div className="panel-header"><div><span className="eyebrow">Resource inspector</span><h2>What this creates</h2></div><span className="panel-index">01</span></div>
          <ResourceInspector entry={selected} />
        </aside>
      </section>

      <section className="panel resource-list-panel full-width-resource-panel">
        <div className="panel-header"><div><span className="eyebrow">Parsed resources</span><h2>Click to inspect</h2></div><span className="panel-index">{String(entries.length).padStart(2, "0")}</span></div>
        <div className="resource-list">
          {entries.map((entry) => <button className={`resource-row ${selected?.id === entry.id ? "resource-row-selected" : ""}`} key={entry.id} type="button" onClick={() => setSelectedId(entry.id)}><ResourceGlyph kind={entry.type} /><span className="resource-row-name"><strong>{entry.name}</strong><small>{getResourceLabel(entry.type)}</small></span><span className="resource-row-plan">{entry.plan ?? "global"}</span><Icon name="chevron" /></button>)}
        </div>
      </section>

      <section className="next-step-callout">
        <span className="callout-number">03</span>
        <div><span className="eyebrow">When you are ready</span><h2>Review the generated YAML, then run Render's Blueprint validation.</h2><p>This demo intentionally stops before deployment. That keeps the learning loop local and leaves the final infrastructure decision in your hands.</p></div>
        <a className="text-link" href="https://render.com/docs/blueprint-spec" target="_blank" rel="noreferrer">Read the Blueprint spec <Icon name="arrow" /></a>
      </section>
    </div>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });
const overviewRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: OverviewPage });
const blueprintRoute = createRoute({ getParentRoute: () => rootRoute, path: "/blueprint", component: BlueprintPage });

export const routeTree = rootRoute.addChildren([overviewRoute, blueprintRoute]);
