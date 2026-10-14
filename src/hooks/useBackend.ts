import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createNote, fetchHealth, fetchNotes, fetchServices, removeNote } from "../lib/api";

// These hooks keep backend state separate from visual components. TanStack Query
// handles loading, retry, cache, and refresh behavior for the browser.
export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: fetchHealth, refetchInterval: 15_000 });
}

export function useServices() {
  return useQuery({ queryKey: ["services"], queryFn: fetchServices });
}

export function useNotes() {
  return useQuery({ queryKey: ["notes"], queryFn: fetchNotes });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useRemoveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
}
