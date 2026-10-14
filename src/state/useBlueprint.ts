import { useContext } from "react";
import { BlueprintContext } from "./context";

// This hook gives UI components a short, typed way to read and update the draft.
export function useBlueprint() {
  const context = useContext(BlueprintContext);
  if (!context) throw new Error("useBlueprint must be used inside BlueprintProvider.");
  return context;
}
