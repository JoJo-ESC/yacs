import * as React from "react";
import type { Subject } from "@/types/courses";
import { fetchMockSubjects } from "@/lib/courses/subjects";

export function useSubjects() {
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    async function loadSubjects() {
      setLoading(true);
      setError(null);

      try {
        const nextSubjects = await fetchMockSubjects();
        if (active) {
          setSubjects(nextSubjects);
        }
      } catch (loadError: unknown) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load subjects.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSubjects();
    return () => {
      active = false;
    };
  }, []);

  return { subjects, loading, error };
}
