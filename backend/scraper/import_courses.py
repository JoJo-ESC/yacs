# backend/scraper/import_courses.py

import argparse
import json
import os
import sys

# Add parent directory to path so we can import from models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models import SessionLocal, Course, init_db


def load_json_file(filepath: str) -> list:
    """Load and parse a JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def import_courses_from_file(filepath: str, db_session) -> int:
    """Import courses from a single JSON file. Returns count of imported courses."""
    courses_data = load_json_file(filepath)
    count = 0

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
        db_session.merge(course)  # merge = insert or update if exists
        count += 1

    db_session.commit()
    return count


def main():
    parser = argparse.ArgumentParser(description='Import course data from JSON files into database')
    parser.add_argument(
        '--term',
        help='Specific term to import (e.g., 202501). If not specified, imports all terms.',
    )
    args = parser.parse_args()

    # Initialize database tables
    init_db()

    # Get data directory
    data_dir = os.path.join(os.path.dirname(__file__), 'data')

    # Get list of files to import
    if args.term:
        files = [f'sis9_courses_{args.term}.json']
    else:
        files = sorted([f for f in os.listdir(data_dir) if f.endswith('.json')])

    db = SessionLocal()
    total = 0

    try:
        for filename in files:
            filepath = os.path.join(data_dir, filename)
            if not os.path.exists(filepath):
                print(f"File not found: {filename}")
                continue

            print(f"Importing {filename}...")
            count = import_courses_from_file(filepath, db)
            print(f"  Imported {count} courses")
            total += count

        print(f"\nTotal: {total} courses imported")
    finally:
        db.close()


if __name__ == '__main__':
    main()
