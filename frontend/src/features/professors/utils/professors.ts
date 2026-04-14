import type { Course } from "@/features/schedule/types/schedule";

export type ProfessorSummary = {
  slug: string;
  name: string;
  departments: string[];
  courseCount: number;
  courses: Array<{
    id: string;
    title: string;
    department: string;
  }>;
};

export function toProfessorSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildProfessorList(catalog: Course[]): ProfessorSummary[] {
  const byProfessor = new Map<
    string,
    {
      departments: Set<string>;
      courses: Map<string, { id: string; title: string; department: string }>;
    }
  >();

  for (const course of catalog) {
    for (const meeting of course.meetings) {
      const instructor = meeting.instructor?.trim();
      if (!instructor) continue;

      const entry = byProfessor.get(instructor) ?? {
        departments: new Set<string>(),
        courses: new Map<string, { id: string; title: string; department: string }>(),
      };

      const departmentLabel = course.school?.trim() || course.department?.trim();
      if (departmentLabel) entry.departments.add(departmentLabel);
      entry.courses.set(course.id, {
        id: course.id,
        title: course.title,
        department: departmentLabel || "Department details coming soon",
      });
      byProfessor.set(instructor, entry);
    }
  }

  return Array.from(byProfessor.entries())
    .map(([name, value]) => ({
      slug: toProfessorSlug(name),
      name,
      departments: Array.from(value.departments).sort((left, right) => left.localeCompare(right)),
      courseCount: value.courses.size,
      courses: Array.from(value.courses.values()).sort((left, right) => left.id.localeCompare(right.id)),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}
