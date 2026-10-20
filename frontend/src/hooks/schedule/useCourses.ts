import { useCatalog } from "@/context/schedule/schedule-context";

export function useCourses() {
  const { catalog, catalogLoading, catalogError } = useCatalog();
  return { courses: catalog, loading: catalogLoading, error: catalogError };
}
