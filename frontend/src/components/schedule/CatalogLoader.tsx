import { useEffect } from "react";
import { useSchedule } from "@/context/schedule-context";

export default function CatalogLoader({ path = "/test-schedule.csv" }: { path?: string }) {
  const { loadCsv } = useSchedule();
  useEffect(() => {
    loadCsv(path).catch(console.error);
  }, [loadCsv, path]);
  return null; 
}
