import json
from typing import Optional

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models.course import Course
from models.database import Base
from models.meeting_time import MeetingTime
from scraper import import_courses


def _course_payload(
    *,
    row_id: int,
    term: Optional[str] = "202509",
    crn: Optional[str] = "72908",
    title: str = "DATA STRUCTURES",
    instructor: str = "Ada Lovelace",
):
    return {
        "id": row_id,
        "term": term,
        "termDesc": "Fall 2025" if term == "202509" else "Spring 2007",
        "courseReferenceNumber": crn,
        "subject": "CSCI",
        "subjectDescription": "Computer Science",
        "courseNumber": "1200",
        "courseTitle": title,
        "creditHours": 4,
        "maximumEnrollment": 50,
        "enrollment": 48,
        "seatsAvailable": 2,
        "sequenceNumber": "01",
        "scheduleTypeDescription": "Lecture",
        "instructionalMethod": "TR",
        "faculty": [
            {
                "displayName": instructor,
                "primaryIndicator": True,
            }
        ],
        "meetingsFaculty": [
            {
                "meetingTime": {
                    "monday": True,
                    "beginTime": "0900",
                    "endTime": "0950",
                    "building": "DCC",
                    "room": "318",
                },
                "faculty": [
                    {
                        "displayName": instructor,
                    }
                ],
            }
        ],
    }


def _write_courses_file(tmp_path, name: str, payloads: list[dict]) -> str:
    path = tmp_path / name
    path.write_text(json.dumps(payloads), encoding="utf-8")
    return str(path)


def _count_meetings(session, *, term: str, crn: str) -> int:
    return session.query(MeetingTime).filter_by(term=term, crn=crn).count()


def _get_course(session, *, term: str, crn: str) -> Course:
    return session.query(Course).filter_by(term=term, crn=crn).one()


def _bind_importer_models(monkeypatch):
    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine, tables=[Course.__table__, MeetingTime.__table__])

    monkeypatch.setattr(import_courses, "Course", Course)
    monkeypatch.setattr(import_courses, "MeetingTime", MeetingTime)

    return Session()


def test_reimport_updates_existing_term_scoped_course(tmp_path, monkeypatch):
    session = _bind_importer_models(monkeypatch)

    first_file = _write_courses_file(tmp_path, "first.json", [_course_payload(row_id=101)])
    rerun_file = _write_courses_file(
        tmp_path,
        "rerun.json",
        [_course_payload(row_id=999, title="DATA STRUCTURES AND ALGORITHMS", instructor="Grace Hopper")],
    )

    assert import_courses.import_courses_from_file(first_file, session) == 1
    assert import_courses.import_courses_from_file(rerun_file, session) == 1

    course = _get_course(session, term="202509", crn="72908")
    assert session.query(Course).filter_by(term="202509", crn="72908").count() == 1
    assert course.course_title == "DATA STRUCTURES AND ALGORITHMS"
    assert _count_meetings(session, term="202509", crn="72908") == 1
    assert session.query(MeetingTime).filter_by(term="202509", crn="72908").one().instructor_name == "Grace Hopper"


def test_same_crn_across_terms_creates_distinct_rows(tmp_path, monkeypatch):
    session = _bind_importer_models(monkeypatch)

    payloads = [
        _course_payload(row_id=101, term="202509", crn="72908", title="DATA STRUCTURES", instructor="Ada Lovelace"),
        _course_payload(row_id=202, term="200701", crn="72908", title="INTRO TO PROGRAMMING", instructor="Edsger Dijkstra"),
    ]
    filepath = _write_courses_file(tmp_path, "historical.json", payloads)

    assert import_courses.import_courses_from_file(filepath, session) == 2

    assert session.query(Course).filter_by(term="202509", crn="72908").count() == 1
    assert session.query(Course).filter_by(term="200701", crn="72908").count() == 1
    assert _get_course(session, term="202509", crn="72908").course_title == "DATA STRUCTURES"
    assert _get_course(session, term="200701", crn="72908").course_title == "INTRO TO PROGRAMMING"
    assert _count_meetings(session, term="202509", crn="72908") == 1
    assert _count_meetings(session, term="200701", crn="72908") == 1


def test_missing_term_or_crn_is_skipped_without_mutating_existing_rows(tmp_path, monkeypatch, capsys):
    session = _bind_importer_models(monkeypatch)

    seed_file = _write_courses_file(tmp_path, "seed.json", [_course_payload(row_id=101)])
    malformed_file = _write_courses_file(
        tmp_path,
        "malformed.json",
        [
            _course_payload(row_id=102, term=None, crn="88888", title="BAD TERM"),
            _course_payload(row_id=103, term="202509", crn=None, title="BAD CRN"),
        ],
    )

    assert import_courses.import_courses_from_file(seed_file, session) == 1
    assert import_courses.import_courses_from_file(malformed_file, session) == 0

    captured = capsys.readouterr()
    assert "Skipping malformed course" in captured.err
    assert "missing required field(s): term" in captured.err
    assert "missing required field(s): courseReferenceNumber" in captured.err
    assert getattr(import_courses.import_courses_from_file, "last_skipped_count", None) == 2
    assert session.query(Course).count() == 1
    assert _get_course(session, term="202509", crn="72908").course_title == "DATA STRUCTURES"
    assert _count_meetings(session, term="202509", crn="72908") == 1
