import type { Course } from "@/types/schedule";
import type { Subject, SubjectCategory, SubjectCategoryId, SubjectSearchResult } from "@/types/courses";
import { MOCK_SUBJECTS, SUBJECT_CATEGORIES } from "@/features/courses/api/mockSubjects";

export const ALL_SUBJECTS_CATEGORY = "all" as const;
export type SubjectFilterCategory = SubjectCategoryId | typeof ALL_SUBJECTS_CATEGORY;

const SEARCH_DELIMITER = /\s+/;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function containsAllTokens(haystack: string, tokens: string[]) {
  return tokens.every((token) => haystack.includes(token));
}

function getSearchBlob(subject: Subject) {
  return [subject.code, subject.name, subject.school, ...(subject.aliases ?? [])]
    .join(" ")
    .toLowerCase();
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

export function searchSubjects(subjects: Subject[], query: string): SubjectSearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return [...subjects]
      .sort((left, right) => left.code.localeCompare(right.code))
      .map((subject) => ({ subject, score: 0 }));
  }

  const tokens = normalizedQuery.split(SEARCH_DELIMITER).filter(Boolean);

  return subjects
    .map((subject) => {
      const code = subject.code.toLowerCase();
      const name = subject.name.toLowerCase();
      const aliases = (subject.aliases ?? []).map((alias) => alias.toLowerCase());
      const blob = getSearchBlob(subject);

      let score = 0;
      if (code === normalizedQuery) score += 120;
      if (name === normalizedQuery) score += 110;
      if (code.startsWith(normalizedQuery)) score += 80;
      if (name.startsWith(normalizedQuery)) score += 72;
      if (code.includes(normalizedQuery)) score += 54;
      if (name.includes(normalizedQuery)) score += 48;
      if (aliases.some((alias) => alias.includes(normalizedQuery))) score += 36;
      if (containsAllTokens(blob, tokens)) score += 32;
      if (tokens.some((token) => code.startsWith(token))) score += 22;
      if (tokens.some((token) => name.includes(token))) score += 16;
      if (tokens.every((token) => blob.includes(token[0] ?? ""))) score += 8;

      return { subject, score };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.subject.code.localeCompare(right.subject.code);
    });
}

export function filterSubjects(subjects: Subject[], query: string, activeCategory: SubjectFilterCategory) {
  const baseSubjects = subjects.filter((subject) => {
    return activeCategory === ALL_SUBJECTS_CATEGORY || subject.category === activeCategory;
  });

  return searchSubjects(baseSubjects, query);
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
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  return MOCK_SUBJECTS;
}
