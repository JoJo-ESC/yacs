export type SubjectCategoryId =
  | "engineering"
  | "science"
  | "hass"
  | "management"
  | "architecture"
  | "itws"
  | "interdisciplinary"
  | "uncategorized";

export interface SubjectCategory {
  id: SubjectCategoryId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: SubjectCategoryId;
  school: string;
  description?: string;
  aliases?: string[];
  featured?: boolean;
  popularity?: number;
}

export interface SubjectSearchResult {
  subject: Subject;
  score: number;
}
