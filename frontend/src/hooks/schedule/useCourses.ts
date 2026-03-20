import { useEffect, useState } from "react";
import { fetchText } from "@/api";
import type { Course } from "@/types/schedule";
import { parseCoursesFromCsvText } from "@/lib/schedule/parseSchedule";

export function useCourses(csvPath = "/fall-2024.csv") {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const text = await fetchText(csvPath);
        const data = parseCoursesFromCsvText(text);
        if (alive) setCourses(data);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to load courses");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [csvPath]);

  return { courses, loading, error };
}
