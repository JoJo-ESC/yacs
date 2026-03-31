import { useEffect } from "react";
import { useSchedule } from "@/context/schedule-context";

export default function CatalogLoader({ semester }: { semester?: string }) {
  const { loadCatalog } = useSchedule();
  useEffect(() => {
    loadCatalog(semester);
  }, [loadCatalog, semester]);
  return null;
}
