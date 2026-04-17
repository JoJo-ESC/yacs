import { apiFetch } from "./client";
import {
  ApiScheduleResponse,
  ApiSaveScheduleRequest,
  ApiSaveScheduleResponse,
  ApiDeleteScheduleResponse,
} from "./types";

export async function getSchedules(): Promise<ApiScheduleResponse[] | null> {
  try {
    return await apiFetch<ApiScheduleResponse[]>("/api/schedules");
  } catch (err: any) {
    if (err.message?.includes("401")) return null;
    throw err;
  }
}

export async function saveSchedule(
  payload: ApiSaveScheduleRequest,
): Promise<ApiSaveScheduleResponse | null> {
  try {
    return await apiFetch<ApiSaveScheduleResponse>("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    if (err.message?.includes("401")) return null;
    throw err;
  }
}

export async function deleteSchedule(
  scheduleId: number,
): Promise<ApiDeleteScheduleResponse | null> {
  try {
    return await apiFetch<ApiDeleteScheduleResponse>(
      `/api/schedules/${scheduleId}`,
      { method: "DELETE" },
    );
  } catch (err: any) {
    if (err.message?.includes("401")) return null;
    throw err;
  }
}
