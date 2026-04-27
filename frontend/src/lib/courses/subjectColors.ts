import type { Subject, SubjectCategoryId } from "@/types/courses";

type SubjectAccent =
  | "blue"
  | "sky"
  | "cyan"
  | "teal"
  | "green"
  | "emerald"
  | "lime"
  | "yellow"
  | "amber"
  | "orange"
  | "red"
  | "rose"
  | "pink"
  | "fuchsia"
  | "indigo"
  | "purple"
  | "slate";

const SUBJECT_ACCENT_BY_CODE: Record<string, SubjectAccent> = {
  ASTR: "sky",
  ARTS: "rose",
  ARCH: "rose",
  ADMN: "slate",
  BIOL: "green",
  BCBP: "emerald",
  BMED: "teal",
  BUSN: "amber",
  CHME: "orange",
  CIVL: "amber",
  CSCI: "blue",
  CHEM: "amber",
  COMM: "purple",
  ECON: "orange",
  ECSE: "indigo",
  ENGR: "red",
  ENVE: "teal",
  ERTH: "teal",
  ESCI: "cyan",
  GSAS: "fuchsia",
  IHSS: "pink",
  ILEA: "cyan",
  INQR: "fuchsia",
  ISYE: "lime",
  ISCI: "cyan",
  ITWS: "blue",
  LANG: "fuchsia",
  LGHT: "yellow",
  LITR: "pink",
  MGMT: "yellow",
  MANE: "orange",
  MATH: "blue",
  MATP: "sky",
  MTLE: "yellow",
  PHIL: "pink",
  PHYS: "sky",
  PSYC: "rose",
  STSO: "purple",
  STSH: "pink",
  USAF: "indigo",
  USAR: "red",
  USNA: "blue",
  WRIT: "purple",
};

const CATEGORY_ACCENT: Record<SubjectCategoryId, SubjectAccent> = {
  engineering: "orange",
  science: "blue",
  hass: "purple",
  management: "amber",
  architecture: "rose",
  itws: "blue",
  interdisciplinary: "teal",
  uncategorized: "slate",
};

function getSubjectAccent(subject: Pick<Subject, "code" | "category">): SubjectAccent {
  return SUBJECT_ACCENT_BY_CODE[subject.code.toUpperCase()] ?? CATEGORY_ACCENT[subject.category] ?? "slate";
}

export function getSubjectBadgeClasses(subject: Pick<Subject, "code" | "category">) {
  switch (getSubjectAccent(subject)) {
    case "blue":
      return {
        solid: "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
        outline:
          "border-blue-200 bg-blue-50/70 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200",
      };
    case "sky":
      return {
        solid: "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
        outline:
          "border-sky-200 bg-sky-50/70 text-sky-800 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-200",
      };
    case "cyan":
      return {
        solid: "bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
        outline:
          "border-cyan-200 bg-cyan-50/70 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200",
      };
    case "teal":
      return {
        solid: "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200",
        outline:
          "border-teal-200 bg-teal-50/70 text-teal-800 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-200",
      };
    case "green":
      return {
        solid: "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200",
        outline:
          "border-green-200 bg-green-50/70 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200",
      };
    case "emerald":
      return {
        solid: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
        outline:
          "border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200",
      };
    case "lime":
      return {
        solid: "bg-lime-50 text-lime-800 dark:bg-lime-950/40 dark:text-lime-200",
        outline:
          "border-lime-200 bg-lime-50/70 text-lime-800 dark:border-lime-800 dark:bg-lime-950/30 dark:text-lime-200",
      };
    case "yellow":
      return {
        solid: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200",
        outline:
          "border-yellow-200 bg-yellow-50/70 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200",
      };
    case "amber":
      return {
        solid: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
        outline:
          "border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
      };
    case "orange":
      return {
        solid: "bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
        outline:
          "border-orange-200 bg-orange-50/70 text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200",
      };
    case "red":
      return {
        solid: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200",
        outline:
          "border-red-200 bg-red-50/70 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200",
      };
    case "rose":
      return {
        solid: "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
        outline:
          "border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200",
      };
    case "pink":
      return {
        solid: "bg-pink-50 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200",
        outline:
          "border-pink-200 bg-pink-50/70 text-pink-800 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-200",
      };
    case "fuchsia":
      return {
        solid: "bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",
        outline:
          "border-fuchsia-200 bg-fuchsia-50/70 text-fuchsia-800 dark:border-fuchsia-800 dark:bg-fuchsia-950/30 dark:text-fuchsia-200",
      };
    case "indigo":
      return {
        solid: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
        outline:
          "border-indigo-200 bg-indigo-50/70 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-200",
      };
    case "purple":
      return {
        solid: "bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200",
        outline:
          "border-purple-200 bg-purple-50/70 text-purple-800 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200",
      };
    default:
      return {
        solid: "bg-slate-100 text-slate-700 dark:bg-[#303030] dark:text-neutral-200",
        outline:
          "border-slate-200 bg-slate-50/70 text-slate-700 dark:border-[#4a4a4a] dark:bg-[#2a2a2a] dark:text-neutral-200",
      };
  }
}
