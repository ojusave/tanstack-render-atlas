import { useEffect, useMemo, useState, type ReactNode } from "react";
import { sampleBlueprint } from "../data/sampleBlueprint";
import { parseBlueprint } from "../lib/blueprint";
import { BlueprintContext, type BlueprintContextValue } from "./context";
const STORAGE_KEY = "tanstack-render-blueprint-studio:yaml";

function getInitialYaml(): { yaml: string; sourceName: string } {
  // Local storage makes the editor survive a refresh without needing a backend.
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved
    ? { yaml: saved, sourceName: saved === sampleBlueprint ? "sample render.yaml" : "local draft" }
    : { yaml: sampleBlueprint, sourceName: "sample render.yaml" };
}

export function BlueprintProvider({ children }: { children: ReactNode }) {
  const initial = getInitialYaml();
  const [rawYaml, setRawYaml] = useState(initial.yaml);
  const [sourceName, setSourceName] = useState(initial.sourceName);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const parsedResult = useMemo(() => {
    try {
      return { parsed: parseBlueprint(rawYaml), error: null };
    } catch (error) {
      return {
        parsed: { services: [], databases: [], previewsEnabled: false },
        error: error instanceof Error ? error.message : "The YAML could not be parsed.",
      };
    }
  }, [rawYaml]);

  useEffect(() => {
    // Saving only the draft YAML keeps the app local and avoids making claims about Render API access.
    window.localStorage.setItem(STORAGE_KEY, rawYaml);
  }, [rawYaml]);

  function loadYaml(nextYaml: string, nextSourceName: string) {
    setRawYaml(nextYaml);
    setSourceName(nextSourceName);
    setSelectedId(null);
  }

  function resetSample() {
    loadYaml(sampleBlueprint, "sample render.yaml");
  }

  function downloadBlueprint() {
    // A browser download gives the user a real render.yaml they can review or commit.
    const blob = new Blob([rawYaml], { type: "application/yaml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "render.yaml";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const value: BlueprintContextValue = {
    rawYaml,
    parsed: parsedResult.parsed,
    sourceName,
    parseError: parsedResult.error,
    selectedId,
    setSelectedId,
    loadYaml,
    resetSample,
    downloadBlueprint,
  };

  return <BlueprintContext.Provider value={value}>{children}</BlueprintContext.Provider>;
}
