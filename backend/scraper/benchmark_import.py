"""
Benchmark script to compare course import performance.
Usage: python benchmark_import.py
"""

import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import text
from models import SessionLocal, Course, init_db


def load_json_file(filepath: str) -> list:
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


# ── Current implementation (merge in loop) ───────────────────────────────────

def import_current(courses_data: list, db_session) -> float:
    """Original: session.merge() one at a time."""
    db_session.execute(text("DELETE FROM course"))
    db_session.commit()

    start = time.perf_counter()
    for course_json in courses_data:
        course = Course(
            id=course_json.get('id'),
            term=course_json.get('term'),
            term_desc=course_json.get('termDesc'),
            crn=course_json.get('courseReferenceNumber'),
            subject=course_json.get('subject'),
            subject_description=course_json.get('subjectDescription'),
            course_number=course_json.get('courseNumber'),
            course_title=course_json.get('courseTitle'),
            credit_hours=course_json.get('creditHours'),
            max_enrollment=course_json.get('maximumEnrollment'),
            enrollment=course_json.get('enrollment'),
            seats_available=course_json.get('seatsAvailable'),
            section=course_json.get('sequenceNumber'),
            schedule_type=course_json.get('scheduleTypeDescription'),
            instructional_method=course_json.get('instructionalMethod'),
        )
        db_session.merge(course)
    db_session.commit()
    return time.perf_counter() - start


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    init_db()

    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    # Use a single mid-size file for a fair, repeatable test
    test_file = os.path.join(data_dir, 'sis9_courses_202501.json')

    print(f"Loading data from {os.path.basename(test_file)}...")
    courses_data = load_json_file(test_file)
    print(f"  {len(courses_data)} courses loaded\n")

    db = SessionLocal()
    try:
        print("Running CURRENT method (merge in loop)...")
        elapsed = import_current(courses_data, db)
        rate = len(courses_data) / elapsed
        print(f"  Time : {elapsed:.2f}s")
        print(f"  Rate : {rate:.0f} courses/sec")
        print(f"\n[Baseline recorded — implement bulk upsert and re-run to compare]")
    finally:
        db.close()


if __name__ == '__main__':
    main()
