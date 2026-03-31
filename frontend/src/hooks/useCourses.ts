import { useCatalog } from "@/context/schedule-context";

export function useCourses() {
  const { catalog, catalogLoading, catalogError } = useCatalog();
  return { courses: catalog, loading: catalogLoading, error: catalogError };
}
