import type { Course } from "@/features/schedule/types/schedule";

export type ProfessorSummary = {
  slug: string;
  name: string;
  departments: string[];
  courseCount: number;
};

export function toProfessorSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildProfessorList(catalog: Course[]): ProfessorSummary[] {
  const byProfessor = new Map<string, { departments: Set<string>; courseIds: Set<string> }>();

  for (const course of catalog) {
    for (const meeting of course.meetings) {
      const instructor = meeting.instructor?.trim();
      if (!instructor) continue;

      const entry = byProfessor.get(instructor) ?? {
        departments: new Set<string>(),
        courseIds: new Set<string>(),
      };

      const departmentLabel = course.school?.trim() || course.department?.trim();
      if (departmentLabel) entry.departments.add(departmentLabel);
      entry.courseIds.add(course.id);
      byProfessor.set(instructor, entry);
    }
  }

  return Array.from(byProfessor.entries())
    .map(([name, value]) => ({
      slug: toProfessorSlug(name),
      name,
      departments: Array.from(value.departments).sort((left, right) => left.localeCompare(right)),
      courseCount: value.courseIds.size,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}
