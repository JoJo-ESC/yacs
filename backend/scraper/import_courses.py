# backend/scraper/import_courses.py

import argparse
import json
import os
import sys

# Add parent directory to path so we can import from models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models import SessionLocal, Course, MeetingTime, init_db, reset_course_tables
from terms import get_active_term_codes


def load_json_file(filepath: str) -> list:
    """Load and parse a JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def import_courses_from_file(filepath: str, db_session) -> int:
    """Import courses from a single JSON file. Returns count of imported courses."""
    courses_data = load_json_file(filepath)
    count = 0

    for course_json in courses_data:
        term = course_json.get('term')
        crn = course_json.get('courseReferenceNumber')
        existing_course = db_session.query(Course).filter_by(term=term, crn=crn).one_or_none()

        course_fields = {
            'term': term,
            'term_desc': course_json.get('termDesc'),
            'crn': crn,
            'subject': course_json.get('subject'),
            'subject_description': course_json.get('subjectDescription'),
            'course_number': course_json.get('courseNumber'),
            'course_title': course_json.get('courseTitle'),
            'credit_hours': course_json.get('creditHours'),
            'max_enrollment': course_json.get('maximumEnrollment'),
            'enrollment': course_json.get('enrollment'),
            'seats_available': course_json.get('seatsAvailable'),
            'section': course_json.get('sequenceNumber'),
            'schedule_type': course_json.get('scheduleTypeDescription'),
            'instructional_method': course_json.get('instructionalMethod'),
        }

        if existing_course is None:
            course = Course(id=course_json.get('id'), **course_fields)
            db_session.add(course)
        else:
            for field_name, value in course_fields.items():
                setattr(existing_course, field_name, value)

        # Replace meeting times for this CRN
        db_session.query(MeetingTime).filter_by(term=term, crn=crn).delete()
        for mf in course_json.get('meetingsFaculty', []):
            mt = mf.get('meetingTime', {})
            # Instructor: meeting-level faculty first, then primary course faculty
            instructor = next(
                (f['displayName'] for f in mf.get('faculty', []) if f.get('displayName')),
                next((f['displayName'] for f in course_json.get('faculty', []) if f.get('primaryIndicator') and f.get('displayName')), None)
            )
            db_session.add(MeetingTime(
                term=term,
                crn=crn,
                monday=mt.get('monday', False),
                tuesday=mt.get('tuesday', False),
                wednesday=mt.get('wednesday', False),
                thursday=mt.get('thursday', False),
                friday=mt.get('friday', False),
                saturday=mt.get('saturday', False),
                sunday=mt.get('sunday', False),
                begin_time=mt.get('beginTime'),
                end_time=mt.get('endTime'),
                building=mt.get('building'),
                building_description=mt.get('buildingDescription'),
                room=mt.get('room'),
                start_date=mt.get('startDate'),
                end_date=mt.get('endDate'),
                meeting_schedule_type=mt.get('meetingScheduleType'),
                instructor_name=instructor,
            ))
        count += 1

    db_session.commit()
    return count


def main():
    parser = argparse.ArgumentParser(description='Import course data from JSON files into database')
    parser.add_argument(
        '--term',
        help='Specific term to import (e.g., 202501).',
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Import all terms on disk (use for initial setup or full refresh).',
    )
    parser.add_argument(
        '--reset-course-tables',
        action='store_true',
        help='Drop and recreate course and meeting_time tables before importing.',
    )
    args = parser.parse_args()

    # Initialize database tables
    init_db()
    if args.reset_course_tables:
        reset_course_tables()
        print("Reset course and meeting_time tables.")

    # Get data directory
    data_dir = os.path.join(os.path.dirname(__file__), 'data')

    # Get list of files to import
    if args.term:
        files = [f'sis9_courses_{args.term}.json']
    elif args.all:
        files = sorted([f for f in os.listdir(data_dir) if f.endswith('.json')])
    else:
        active_codes = get_active_term_codes()
        files = [f'sis9_courses_{code}.json' for code in sorted(active_codes)]

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
