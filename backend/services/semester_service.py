from __future__ import annotations

from pathlib import Path
import re
from typing import Any, Dict, Iterable, List

from utils import load_config

_BACKEND_DIR = Path(__file__).resolve().parents[1]
_TERM_CODE_PATTERN = re.compile(r"(\d{6})")
_TERM_SUFFIX_TO_SEASON = {
    "01": "Spring",
    "05": "Summer",
    "09": "Fall",
    "12": "Winter",
}
_DEFAULT_SEMESTER_DATA_GLOBS = ["scraper/data/sis9_courses_*.json"]


def _normalize_semester_entry(entry: Any, source: str) -> Dict[str, str]:
    if isinstance(entry, str):
      return {"id": entry, "name": term_code_to_label(entry), "source": source}

    if isinstance(entry, dict):
        semester_id = str(entry.get("id") or entry.get("term") or "").strip()
        semester_name = str(entry.get("name") or entry.get("label") or entry.get("termDesc") or "").strip()
        if not semester_id:
            raise ValueError("Semester config entries must include an 'id' or 'term' field")
        if not semester_name:
            semester_name = term_code_to_label(semester_id)
        return {"id": semester_id, "name": semester_name, "source": str(entry.get("source") or source)}

    raise ValueError("Semester entries must be strings or objects")


def term_code_to_label(term_code: str) -> str:
    term = str(term_code).strip()
    if re.fullmatch(r"\d{6}", term):
        year = term[:4]
        season = _TERM_SUFFIX_TO_SEASON.get(term[4:], "Term")
        return f"{season} {year}"
    return term


def _iter_semester_data_paths(globs: Iterable[str]) -> Iterable[Path]:
    for pattern in globs:
        for path in _BACKEND_DIR.glob(pattern):
            if path.is_file():
                yield path


def discover_semesters_from_files(globs: Iterable[str] | None = None) -> List[Dict[str, str]]:
    patterns = list(globs or _DEFAULT_SEMESTER_DATA_GLOBS)
    semesters: Dict[str, Dict[str, str]] = {}

    for path in _iter_semester_data_paths(patterns):
        match = _TERM_CODE_PATTERN.search(path.stem)
        if not match:
            continue

        term_code = match.group(1)
        semesters[term_code] = {
            "id": term_code,
            "name": term_code_to_label(term_code),
            "source": str(path.relative_to(_BACKEND_DIR)),
        }

    return sorted(semesters.values(), key=lambda semester: semester["id"], reverse=True)


def list_semesters(config: Dict[str, Any] | None = None) -> List[Dict[str, str]]:
    settings = config or load_config()

    configured_semesters = settings.get("SEMESTERS")
    if configured_semesters:
        semesters = [
            _normalize_semester_entry(entry, source="config")
            for entry in configured_semesters
        ]
        unique_semesters = {semester["id"]: semester for semester in semesters}
        return sorted(unique_semesters.values(), key=lambda semester: semester["id"], reverse=True)

    data_globs = settings.get("SEMESTER_DATA_GLOBS") or _DEFAULT_SEMESTER_DATA_GLOBS
    return discover_semesters_from_files(data_globs)
