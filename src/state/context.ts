import { createContext } from "react";
import type { ParsedBlueprint } from "../lib/blueprint";

// The context type describes the small shared contract between the editor and
// overview pages. Keeping this non-component code in its own file also keeps
// Vite's Fast Refresh behavior predictable during local development.
export type BlueprintContextValue = {
  rawYaml: string;
  parsed: ParsedBlueprint;
  sourceName: string;
  parseError: string | null;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  loadYaml: (nextYaml: string, sourceName: string) => void;
  resetSample: () => void;
  downloadBlueprint: () => void;
};

// A null default makes an incorrect component boundary fail with a clear error.
export const BlueprintContext = createContext<BlueprintContextValue | null>(null);
