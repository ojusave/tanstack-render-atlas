import { parse, stringify } from "yaml";

// These are the Render resource shapes this demo needs to explain on screen.
// Unknown Blueprint fields are preserved in the raw YAML so the editor does not
// silently discard configuration it does not understand.
export type BlueprintResourceKind =
  | "web"
  | "static"
  | "private"
  | "worker"
  | "cron"
  | "keyvalue"
  | "workflow"
  | "postgres";

export type BlueprintEntry = {
  id: string;
  name: string;
  type: BlueprintResourceKind;
  rawType: string;
  runtime?: string;
  plan?: string;
  region?: string;
  schedule?: string;
  buildCommand?: string;
  startCommand?: string;
  envVars: Record<string, unknown>[];
  raw: Record<string, unknown>;
};

export type ParsedBlueprint = {
  services: BlueprintEntry[];
  databases: BlueprintEntry[];
  previewsEnabled: boolean;
};

export type BlueprintDraft = {
  type: BlueprintResourceKind;
  name: string;
};

const serviceLabels: Record<BlueprintResourceKind, string> = {
  web: "Web service",
  static: "Static site",
  private: "Private service",
  worker: "Background worker",
  cron: "Cron job",
  keyvalue: "Key Value",
  workflow: "Workflow",
  postgres: "Postgres",
};

// Keeping the labels in one function means cards and the editor use the same words.
export function getResourceLabel(kind: BlueprintResourceKind): string {
  return serviceLabels[kind];
}

// A plain object check prevents malformed YAML values from causing a blank screen.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function asRecordList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

function normalizeKind(entry: Record<string, unknown>): BlueprintResourceKind {
  const rawType = optionalString(entry.type) ?? "web";
  const runtime = optionalString(entry.runtime);

  // Render uses type: web plus runtime: static for a static site.
  if (rawType === "web" && runtime === "static") return "static";
  if (rawType === "pserv") return "private";
  if (rawType === "redis") return "keyvalue";
  if (rawType === "web" || rawType === "worker" || rawType === "cron" || rawType === "keyvalue" || rawType === "workflow") {
    return rawType;
  }
  return "web";
}

function toEntry(entry: Record<string, unknown>, index: number, collection: "service" | "database"): BlueprintEntry {
  const kind = collection === "database" ? "postgres" : normalizeKind(entry);
  const rawType = optionalString(entry.type) ?? (collection === "database" ? "postgres" : "web");
  const name = optionalString(entry.name) ?? `${getResourceLabel(kind)} ${index + 1}`;

  return {
    id: `${collection}-${name}-${index}`,
    name,
    type: kind,
    rawType,
    runtime: optionalString(entry.runtime),
    plan: optionalString(entry.plan),
    region: optionalString(entry.region),
    schedule: optionalString(entry.schedule),
    buildCommand: optionalString(entry.buildCommand),
    startCommand: optionalString(entry.startCommand),
    envVars: asRecordList(entry.envVars),
    raw: entry,
  };
}

export function parseBlueprint(rawYaml: string): ParsedBlueprint {
  const parsed: unknown = parse(rawYaml);
  if (!isRecord(parsed)) {
    throw new Error("The Blueprint must contain a YAML object at its root.");
  }

  const services = asRecordList(parsed.services).map((entry, index) => toEntry(entry, index, "service"));
  const databases = asRecordList(parsed.databases).map((entry, index) => toEntry(entry, index, "database"));
  const previews = isRecord(parsed.previews) ? parsed.previews : undefined;

  return {
    services,
    databases,
    previewsEnabled: optionalString(previews?.generation) === "automatic",
  };
}

// This creates a small, paid-plan-friendly example entry for the add-resource control.
// It does not call Render, and the resulting YAML remains editable before deployment.
export function createResourceDraft({ type, name }: BlueprintDraft): Record<string, unknown> {
  if (type === "postgres") {
    return {
      name,
      plan: "basic-256mb",
      region: "oregon",
      databaseName: name.replace(/[^a-z0-9]+/gi, "_").toLowerCase(),
      user: "app",
    };
  }

  if (type === "static") {
    return {
      type: "web",
      name,
      runtime: "static",
      buildCommand: "npm install && npm run build",
      staticPublishPath: "./dist",
    };
  }

  if (type === "keyvalue") {
    return { type: "keyvalue", name, plan: "starter", region: "oregon" };
  }

  if (type === "private") {
    return {
      type: "pserv",
      name,
      runtime: "node",
      plan: "1c-2g",
      region: "oregon",
      buildCommand: "npm install",
      startCommand: "npm run api",
    };
  }

  if (type === "worker") {
    return {
      type,
      name,
      runtime: "node",
      plan: "1c-2g",
      region: "oregon",
      buildCommand: "npm install",
      startCommand: "npm run worker",
    };
  }

  if (type === "cron") {
    return {
      type,
      name,
      runtime: "node",
      plan: "1c-2g",
      region: "oregon",
      schedule: "0 3 * * *",
      buildCommand: "npm install",
      startCommand: "npm run cleanup",
    };
  }

  if (type === "workflow") {
    return {
      type,
      name,
      runtime: "node",
      plan: "1c-2g",
      region: "oregon",
    };
  }

  return {
    type: "web",
    name,
    runtime: "node",
    plan: "1c-2g",
    region: "oregon",
    buildCommand: "npm install && npm run build",
    startCommand: "npm run start",
  };
}

export function addResourceToBlueprint(rawYaml: string, draft: BlueprintDraft): string {
  const parsed: unknown = parse(rawYaml);
  const document = isRecord(parsed) ? parsed : {};
  const key = draft.type === "postgres" ? "databases" : "services";
  const existing = asRecordList(document[key]);

  document[key] = [...existing, createResourceDraft(draft)];
  return stringify(document);
}

export function countReferences(entries: BlueprintEntry[]): number {
  // A reference is a service-to-service or service-to-database connection.
  // Counting key names keeps this demo transparent instead of pretending to be a full schema validator.
  return entries.reduce((total, entry) => {
    const text = JSON.stringify(entry.raw);
    return total + (text.match(/fromService|fromDatabase/g)?.length ?? 0);
  }, 0);
}
