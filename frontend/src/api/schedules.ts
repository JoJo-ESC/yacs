import { apiFetch } from "./client";

// The logged-in user's saved schedules (see lib/schedule/savedSchedules).
export function fetchAccountSchedules() {
  return apiFetch<{ schedules: unknown }>("/api/schedules", { credentials: "include" });
}

// `storeJson` is the already-serialized ScheduleStore.
export function saveAccountSchedules(storeJson: string) {
  return apiFetch<{ success: boolean }>("/api/schedules", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: `{"schedules":${storeJson}}`,
  });
}
