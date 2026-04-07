import type { Course } from "@/types/schedule";
import type { Subject, SubjectCategory, SubjectCategoryId, SubjectSearchResult } from "@/types/courses";
import { MOCK_SUBJECTS, SUBJECT_CATEGORIES } from "@/features/courses/api/mockSubjects";

export const ALL_SUBJECTS_CATEGORY = "all" as const;
export type SubjectFilterCategory = SubjectCategoryId | typeof ALL_SUBJECTS_CATEGORY;

const SEARCH_DELIMITER = /\s+/;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhrase(value: string) {
  return value.trim().toLowerCase().replace(SEARCH_DELIMITER, " ");
}

function getSearchBlob(subject: Subject) {
  return [subject.code, subject.name, subject.school, ...(subject.aliases ?? [])]
    .join(" ")
    .toLowerCase();
}

function getCourseSearchBlob(course: Course) {
  return [course.id, course.title, course.department, course.school]
    .join(" ")
    .toLowerCase();
}

function getCourseMatchScore(course: Course, normalizedQuery: string) {
  const id = normalizePhrase(course.id);
  const title = normalizePhrase(course.title);
  const department = normalizePhrase(course.department);
  const blob = normalizePhrase(getCourseSearchBlob(course));

  let score = 0;
  if (id === normalizedQuery) score += 140;
  if (title === normalizedQuery) score += 132;
  if (id.startsWith(normalizedQuery)) score += 104;
  if (title.startsWith(normalizedQuery)) score += 92;
  if (id.includes(normalizedQuery)) score += 72;
  if (title.includes(normalizedQuery)) score += 64;
  if (department === normalizedQuery) score += 36;
  if (blob.includes(normalizedQuery)) score += 28;

  return score;
}

export function getSubjectCategories(): SubjectCategory[] {
  return SUBJECT_CATEGORIES;
}

export function getCategoryMeta(categoryId: SubjectCategoryId) {
  return SUBJECT_CATEGORIES.find((category) => category.id === categoryId);
}

export function getCategoryCounts(subjects: Subject[]) {
  return SUBJECT_CATEGORIES.map((category) => ({
    category,
    count: subjects.filter((subject) => subject.category === category.id).length,
  }));
}

export function searchCatalogCourses(catalog: Course[], query: string): Array<{ course: Course; score: number }> {
  const normalizedQuery = normalizePhrase(query);
  if (!normalizedQuery) {
    return [];
  }

  return catalog
    .map((course) => ({
      course,
      score: getCourseMatchScore(course, normalizedQuery),
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.course.id.localeCompare(right.course.id);
    });
}

export function searchSubjects(subjects: Subject[], query: string, catalog: Course[] = []): SubjectSearchResult[] {
  const normalizedQuery = normalizePhrase(query);
  if (!normalizedQuery) {
    return [...subjects]
      .sort((left, right) => left.code.localeCompare(right.code))
      .map((subject) => ({ subject, score: 0 }));
  }
  const coursesByDepartment = catalog.reduce<Record<string, Course[]>>((groups, course) => {
    const department = course.department.toUpperCase();
    if (!groups[department]) {
      groups[department] = [];
    }
    groups[department].push(course);
    return groups;
  }, {});

  return subjects
    .map((subject) => {
      const code = normalizePhrase(subject.code);
      const name = normalizePhrase(subject.name);
      const aliases = (subject.aliases ?? []).map((alias) => normalizePhrase(alias));
      const blob = normalizePhrase(getSearchBlob(subject));
      const matchingCourses = coursesByDepartment[subject.code.toUpperCase()] ?? [];

      let score = 0;
      if (code === normalizedQuery) score += 120;
      if (name === normalizedQuery) score += 110;
      if (code.startsWith(normalizedQuery)) score += 80;
      if (name.startsWith(normalizedQuery)) score += 72;
      if (code.includes(normalizedQuery)) score += 54;
      if (name.includes(normalizedQuery)) score += 48;
      if (aliases.some((alias) => alias.includes(normalizedQuery))) score += 36;
      if (blob.includes(normalizedQuery)) score += 32;
      score += matchingCourses.reduce((bestScore, course) => {
        return Math.max(bestScore, getCourseMatchScore(course, normalizedQuery));
      }, 0);

      return { subject, score };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.subject.code.localeCompare(right.subject.code);
    });
}

export function filterSubjects(
  subjects: Subject[],
  query: string,
  activeCategory: SubjectFilterCategory,
  catalog: Course[] = [],
) {
  const baseSubjects = subjects.filter((subject) => {
    return activeCategory === ALL_SUBJECTS_CATEGORY || subject.category === activeCategory;
  });

  return searchSubjects(baseSubjects, query, catalog);
}

export function getGroupedSubjects(subjects: Subject[]) {
  return SUBJECT_CATEGORIES
    .map((category) => ({
      category,
      subjects: subjects
        .filter((subject) => subject.category === category.id)
        .sort((left, right) => left.code.localeCompare(right.code)),
    }))
    .filter((group) => group.subjects.length > 0);
}

export function getCourseCountBySubject(catalog: Course[]) {
  return catalog.reduce<Record<string, number>>((counts, course) => {
    counts[course.department] = (counts[course.department] ?? 0) + 1;
    return counts;
  }, {});
}

export function getSubjectByCode(subjects: Subject[], code: string) {
  const normalizedCode = normalize(code).toUpperCase();
  return subjects.find((subject) => subject.code.toUpperCase() === normalizedCode);
}

export async function fetchMockSubjects() {
  return MOCK_SUBJECTS;
}
