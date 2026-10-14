import { useMemo, useState, type FormEvent } from "react";
import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import { Icon } from "./components/Icons";
import { useCreateTask, useDeleteTask, useHealth, useTasks, useToggleTask } from "./hooks/useBackend";
import type { Task } from "./lib/api";

type TaskFilter = "all" | "open" | "done";

function StatusPill({ children, tone = "green" }: { children: string; tone?: "green" | "orange" | "muted" }) {
  // The text and dot together make the connection state understandable without relying on color alone.
  return <span className={`status-pill status-pill-${tone}`}><span className="status-dot" />{children}</span>;
}

function Brand() {
  // The mark is made from three bars to suggest a short list growing one item at a time.
  return (
    <div className="brand-lockup">
      <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
      <div>
        <strong>Focus Board</strong>
        <span>Simple tasks, clear next steps</span>
      </div>
    </div>
  );
}

function AppShell() {
  const health = useHealth();
  const statusTone = health.isError ? "orange" : health.isPending ? "muted" : "green";
  const statusText = health.isError ? "API offline" : health.isPending ? "Checking API" : "API connected";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />

        <nav className="primary-nav" aria-label="Primary navigation">
          <a className="nav-link nav-link-active" href="#tasks">
            <span className="nav-icon"><Icon name="layers" /></span>
            <span>Tasks</span>
          </a>
        </nav>

        <div className="sidebar-divider" />
        <div className="sidebar-section-label">How it works</div>
        <div className="stack-list">
          <div><span className="stack-number">1</span><span><strong>Browser</strong><small>TanStack UI</small></span></div>
          <div><span className="stack-number">2</span><span><strong>API</strong><small>Node backend</small></span></div>
          <div><span className="stack-number">3</span><span><strong>Storage</strong><small>Memory or Postgres</small></span></div>
        </div>

        <div className="sidebar-bottom">
          <div className="connection-card">
            <div className="connection-card-heading"><span className="connection-icon"><Icon name="database" /></span><strong>Local app</strong></div>
            <StatusPill tone={statusTone}>{statusText}</StatusPill>
            <p>{health.data?.database === "postgres" ? "Using PostgreSQL." : "Using temporary local storage."}</p>
          </div>
          <p className="sidebar-footer">Open this app locally, add a task, and see the full request path work.</p>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <span className="topbar-label">Today</span>
          <StatusPill tone={statusTone}>{statusText}</StatusPill>
        </header>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}

function StatBlock({ label, value, detail }: { label: string; value: number; detail: string }) {
  // Each number answers a useful question before the user works with the list.
  return (
    <div className="stat-block">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <span className="stat-detail">{detail}</span>
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete, busy }: { task: Task; onToggle: () => void; onDelete: () => void; busy: boolean }) {
  return (
    <li className={`task-row ${task.completed ? "task-row-complete" : ""}`}>
      <label className="task-check">
        <input type="checkbox" checked={task.completed} onChange={onToggle} disabled={busy} />
        <span className="task-checkmark" aria-hidden="true"><Icon name="check" /></span>
        <span className="visually-hidden">{task.completed ? "Mark task open" : "Mark task complete"}: {task.title}</span>
      </label>
      <div className="task-copy">
        <strong>{task.title}</strong>
        <span>{task.completed ? "Completed" : "Open"}</span>
      </div>
      <button className="delete-button" type="button" onClick={onDelete} disabled={busy} aria-label={`Delete task: ${task.title}`}>
        Delete
      </button>
    </li>
  );
}

function TaskList({ tasks, filter, toggle, remove, busy }: { tasks: Task[]; filter: TaskFilter; toggle: (task: Task) => void; remove: (task: Task) => void; busy: boolean }) {
  const visibleTasks = useMemo(() => {
    if (filter === "open") return tasks.filter((task) => !task.completed);
    if (filter === "done") return tasks.filter((task) => task.completed);
    return tasks;
  }, [filter, tasks]);

  if (visibleTasks.length === 0) {
    // The empty state says what happened and what action will change it.
    return <div className="empty-state"><span className="empty-state-icon"><Icon name="check" /></span><strong>{filter === "done" ? "Nothing is complete yet." : filter === "open" ? "No open tasks." : "Your list is empty."}</strong><span>{filter === "done" ? "Finish a task and it will appear here." : "Add a task above to get started."}</span></div>;
  }

  return (
    <ul className="task-list">
      {visibleTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggle(task)} onDelete={() => remove(task)} busy={busy} />)}
    </ul>
  );
}

function TasksPage() {
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const tasksQuery = useTasks();
  const create = useCreateTask();
  const toggle = useToggleTask();
  const remove = useDeleteTask();
  const tasks = tasksQuery.data ?? [];
  const openCount = tasks.filter((task) => !task.completed).length;
  const doneCount = tasks.length - openCount;
  const mutationBusy = create.isPending || toggle.isPending || remove.isPending;

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    setSuccessMessage("");

    if (!title) {
      setFormError("Enter a task before adding it.");
      return;
    }

    setFormError("");
    create.mutate(title, {
      onSuccess: () => {
        setDraft("");
        setSuccessMessage("Task added.");
        window.setTimeout(() => setSuccessMessage(""), 1800);
      },
      onError: (error) => setFormError(error instanceof Error ? error.message : "The task could not be added."),
    });
  }

  function toggleTask(task: Task) {
    setSuccessMessage("");
    toggle.mutate({ id: task.id, completed: !task.completed });
  }

  function deleteTask(task: Task) {
    setSuccessMessage("");
    remove.mutate(task.id);
  }

  return (
    <div className="page" id="tasks">
      <section className="hero-block">
        <div>
          <div className="overline"><span className="overline-rule" />A small task list</div>
          <h1>Make progress<br /><em>one task at a time.</em></h1>
          <p className="hero-copy">Capture the next thing, mark it done, and keep the list easy to understand.</p>
        </div>
        <div className="hero-side-note">
          <span className="hero-side-icon"><Icon name="check" /></span>
          <strong>Start with one task</strong>
          <span>The app is already connected to its local API.</span>
        </div>
      </section>

      <section className="stat-strip" aria-label="Task summary">
        <StatBlock label="Open" value={openCount} detail="ready to work on" />
        <StatBlock label="Done" value={doneCount} detail="finished tasks" />
        <StatBlock label="Total" value={tasks.length} detail="in this list" />
      </section>

      <section className="task-panel" aria-labelledby="task-list-heading">
        <div className="panel-header">
          <div><span className="eyebrow">Your work</span><h2 id="task-list-heading">Tasks</h2></div>
          <span className="panel-count">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
        </div>

        <form className="task-form" onSubmit={submitTask}>
          <label className="visually-hidden" htmlFor="new-task">New task</label>
          <input id="new-task" maxLength={160} placeholder="What needs doing?" value={draft} onChange={(event) => setDraft(event.target.value)} />
          <button className="button button-orange" type="submit" disabled={create.isPending}><Icon name="plus" />{create.isPending ? "Adding" : "Add task"}</button>
        </form>
        {formError ? <div className="message message-error" role="alert">{formError}</div> : null}
        {successMessage ? <div className="message message-success" role="status">{successMessage}</div> : null}

        <div className="task-toolbar">
          <div className="filter-group" role="group" aria-label="Filter tasks">
            {(["all", "open", "done"] as TaskFilter[]).map((option) => <button key={option} className={`filter-button ${filter === option ? "filter-button-active" : ""}`} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)}>{option === "all" ? "All" : option === "open" ? "Open" : "Done"}</button>)}
          </div>
          <span className="toolbar-hint">Select a checkbox to update a task.</span>
        </div>

        {tasksQuery.isPending ? <div className="loading-state">Loading your tasks...</div> : null}
        {tasksQuery.isError ? <div className="error-state"><strong>Could not load your tasks.</strong><span>Make sure the local API is running, then try again.</span><button className="button button-ghost" type="button" onClick={() => tasksQuery.refetch()}>Try again</button></div> : null}
        {!tasksQuery.isPending && !tasksQuery.isError ? <TaskList tasks={tasks} filter={filter} toggle={toggleTask} remove={deleteTask} busy={mutationBusy} /> : null}
      </section>

      <p className="storage-note"><Icon name="database" />The app uses temporary memory storage locally unless you provide a database connection.</p>
    </div>
  );
}

const rootRoute = createRootRoute({ component: AppShell });
const tasksRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: TasksPage });

export const routeTree = rootRoute.addChildren([tasksRoute]);
