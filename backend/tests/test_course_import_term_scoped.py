"""Runtime check for term-scoped course imports using SQLite."""

import importlib.util
import pathlib
import sys
import types

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def load_module_as(name: str, path: pathlib.Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def upsert_course(session, Course, MeetingTime, payload):
    term = payload["term"]
    crn = payload["crn"]
    existing = session.query(Course).filter_by(term=term, crn=crn).one_or_none()

    fields = {
        "term": term,
        "term_desc": payload["term_desc"],
        "crn": crn,
        "subject": payload["subject"],
        "subject_description": payload["subject_description"],
        "course_number": payload["course_number"],
        "course_title": payload["course_title"],
        "credit_hours": payload["credit_hours"],
        "max_enrollment": payload["max_enrollment"],
        "enrollment": payload["enrollment"],
        "seats_available": payload["seats_available"],
        "section": payload["section"],
        "schedule_type": payload["schedule_type"],
        "instructional_method": payload["instructional_method"],
    }

    if existing is None:
        session.add(Course(id=payload["id"], **fields))
    else:
        for name, value in fields.items():
            setattr(existing, name, value)

    session.query(MeetingTime).filter_by(term=term, crn=crn).delete()
    for instructor_name in payload["instructors"]:
        session.add(MeetingTime(term=term, crn=crn, instructor_name=instructor_name))


def main():
    models_dir = pathlib.Path(__file__).resolve().parents[1] / "models"

    models_pkg = types.ModuleType("models")
    models_pkg.__path__ = [str(models_dir)]
    sys.modules["models"] = models_pkg

    database_mod = load_module_as("models.database", models_dir / "database.py")
    sys.modules["models.database"] = database_mod
    course_mod = load_module_as("models.course", models_dir / "course.py")
    sys.modules["models.course"] = course_mod
    meeting_time_mod = load_module_as("models.meeting_time", models_dir / "meeting_time.py")
    sys.modules["models.meeting_time"] = meeting_time_mod

    Base = database_mod.Base
    Course = course_mod.Course
    MeetingTime = meeting_time_mod.MeetingTime

    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)

    session = Session()

    first_import = {
        "id": 101,
        "term": "202509",
        "term_desc": "Fall 2025",
        "crn": "72908",
        "subject": "CSCI",
        "subject_description": "Computer Science",
        "course_number": "1200",
        "course_title": "DATA STRUCTURES",
        "credit_hours": 4,
        "max_enrollment": 50,
        "enrollment": 48,
        "seats_available": 2,
        "section": "01",
        "schedule_type": "Lecture",
        "instructional_method": "TR",
        "instructors": ["Ada Lovelace"],
    }
    rerun_import = dict(first_import)
    rerun_import["course_title"] = "DATA STRUCTURES AND ALGORITHMS"
    rerun_import["instructors"] = ["Grace Hopper"]

    historical_import = dict(first_import)
    historical_import["id"] = 202
    historical_import["term"] = "200701"
    historical_import["term_desc"] = "Spring 2007"
    historical_import["course_title"] = "INTRO TO PROGRAMMING"
    historical_import["instructors"] = ["Edsger Dijkstra"]

    upsert_course(session, Course, MeetingTime, first_import)
    session.commit()

    upsert_course(session, Course, MeetingTime, rerun_import)
    session.commit()

    upsert_course(session, Course, MeetingTime, historical_import)
    session.commit()

    fall_courses = session.query(Course).filter_by(term="202509", crn="72908").all()
    spring_courses = session.query(Course).filter_by(term="200701", crn="72908").all()
    all_meetings = session.query(MeetingTime).filter_by(crn="72908").all()

    assert len(fall_courses) == 1
    assert len(spring_courses) == 1
    assert fall_courses[0].course_title == "DATA STRUCTURES AND ALGORITHMS"
    assert session.query(MeetingTime).filter_by(term="202509", crn="72908").count() == 1
    assert session.query(MeetingTime).filter_by(term="202509", crn="72908").one().instructor_name == "Grace Hopper"
    assert session.query(MeetingTime).filter_by(term="200701", crn="72908").count() == 1
    assert len(all_meetings) == 2

    print("SUCCESS: course imports are idempotent and CRNs are term-scoped")


if __name__ == "__main__":
    main()
