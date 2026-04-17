"""
Benchmark: importing all terms vs. active terms only.

Measures JSON file I/O and parsing time — the work that scales linearly
with course count and dominates import runtime.

Usage:
    cd backend/scraper
    python benchmark_import.py
"""

import json
import os
import time

from terms import get_active_term_codes

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")


def load_files(files: list[str]) -> tuple[int, float]:
    """Load and parse JSON files. Returns (total_courses, elapsed_seconds)."""
    total = 0
    start = time.perf_counter()
    for filename in files:
        path = os.path.join(DATA_DIR, filename)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            total += len(data)
    elapsed = time.perf_counter() - start
    return total, elapsed


def get_all_files() -> list[str]:
    return sorted(f for f in os.listdir(DATA_DIR) if f.endswith(".json"))


def get_active_files() -> list[str]:
    codes = get_active_term_codes()
    return [f"sis9_courses_{code}.json" for code in sorted(codes)]


def main():
    all_files = get_all_files()
    active_files = get_active_files()

    print("Running benchmark (3 trials each)...\n")

    # Run 3 trials each to smooth out disk cache effects
    trials = 3
    all_times = []
    active_times = []
    all_courses = active_courses = 0

    for i in range(trials):
        courses, elapsed = load_files(all_files)
        all_courses = courses
        all_times.append(elapsed)

        courses, elapsed = load_files(active_files)
        active_courses = courses
        active_times.append(elapsed)

    all_avg = sum(all_times) / trials
    active_avg = sum(active_times) / trials

    course_reduction = (1 - active_courses / all_courses) * 100 if all_courses else 0
    file_reduction = (1 - len(active_files) / len(all_files)) * 100 if all_files else 0
    speed_improvement = (1 - active_avg / all_avg) * 100 if all_avg else 0

    print(f"{'':20} {'Files':>8} {'Courses':>10} {'Avg time':>10}")
    print(f"{'-'*50}")
    print(f"{'All terms':20} {len(all_files):>8} {all_courses:>10,} {all_avg:>9.2f}s")
    print(f"{'Active terms only':20} {len(active_files):>8} {active_courses:>10,} {active_avg:>9.2f}s")
    print(f"{'-'*50}")
    print(f"\nReduction in files:   {file_reduction:.1f}%")
    print(f"Reduction in courses: {course_reduction:.1f}%")
    print(f"Speed improvement:    {speed_improvement:.1f}% faster")
    print(f"\n(Averaged over {trials} trials)")


if __name__ == "__main__":
    main()
