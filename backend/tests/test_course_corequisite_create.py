"""Model schema smoke test using a temporary, isolated database."""
from sqlalchemy import create_engine, inspect

from models.course_corequisite import CourseCorequisite


def test_course_corequisite_schema(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'corequisite.sqlite'}")
    try:
        CourseCorequisite.__table__.create(engine)
        columns = {column["name"] for column in inspect(engine).get_columns("course_corequisite")}
        assert {"department", "level", "corequisite"} <= columns
    finally:
        engine.dispose()
