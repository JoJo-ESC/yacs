"""Catalog routes backed by real queries, including term and meeting data."""
import pytest

from models.course import Course
from models.meeting_time import MeetingTime


@pytest.fixture
def catalog(api_client, test_session_factory):
    with test_session_factory() as db:
        db.add_all([
            Course(id=1, term="202609", term_desc="Fall 2026", crn="10001", subject="CSCI",
                   subject_description="Computer Science", course_number="1200", course_title="Data Structures", section="01"),
            Course(id=2, term="202609", term_desc="Fall 2026", crn="10002", subject="MATH",
                   subject_description="Mathematics", course_number="1010", course_title="Calculus", section="01"),
            Course(id=3, term="202601", term_desc="Spring 2026", crn="10001", subject="CSCI",
                   subject_description="Computer Science", course_number="1200", course_title="Data Structures", section="01"),
        ])
        db.flush()
        db.add(MeetingTime(term="202609", crn="10001", monday=True, begin_time="0900", end_time="0950", room="101"))
        db.commit()


def test_pagination_and_order(api_client, catalog):
    first = api_client.get("/api/courses", params={"per_page": 2}).json()
    assert [row["id"] for row in first["data"]] == [1, 2]
    assert first["pagination"] == {"page": 1, "per_page": 2, "total": 3, "total_pages": 2}
    second = api_client.get("/api/courses", params={"per_page": 2, "page": 2}).json()
    assert [row["id"] for row in second["data"]] == [3]
    assert api_client.get("/api/courses?page=3&per_page=2").json()["data"] == []


@pytest.mark.parametrize("path,ids", [
    ("/api/courses?semester=202601", [3]),
    ("/api/courses/search?q=structures&semester=202609", [1]),
    ("/api/courses/search?q=1200", [1, 3]),
    ("/api/courses/search?q=math", [2]),
    ("/api/courses/department/CSCI?semester=202609", [1]),
    ("/api/courses/department/UNKNOWN", []),
    ("/api/courses/search?q=nonexistent", []),
])
def test_catalog_filters(api_client, catalog, path, ids):
    response = api_client.get(path)
    assert response.status_code == 200
    assert [row["id"] for row in response.json()["data"]] == ids
    assert response.json()["pagination"]["total"] == len(ids)


def test_detail_meetings_are_term_scoped(api_client, catalog):
    response = api_client.get("/api/courses/1")
    assert response.status_code == 200
    meeting = response.json()["meeting_times"][0]
    assert meeting["monday"] is True
    assert meeting["begin_time"] == "0900"
    assert meeting["end_time"] == "0950"
    assert api_client.get("/api/courses/3").json()["meeting_times"] == []
    assert api_client.get("/api/courses/999").status_code == 404


def test_catalog_lookups(api_client, catalog):
    assert api_client.get("/api/departments").json() == [
        {"code": "CSCI", "name": "Computer Science"}, {"code": "MATH", "name": "Mathematics"}]
    assert api_client.get("/api/semesters").json() == [
        {"term": "202609", "name": "Fall 2026"}, {"term": "202601", "name": "Spring 2026"}]


@pytest.mark.parametrize("path", ["/api/courses?page=0", "/api/courses?per_page=101",
    "/api/courses?per_page=0", "/api/courses/search", "/api/courses/search?q=",
    "/api/courses/department/CSCI?page=-1", "/api/courses/not-an-id"])
def test_invalid_catalog_requests(api_client, path):
    assert api_client.get(path).status_code == 400


def test_empty_catalog(api_client):
    response = api_client.get("/api/courses")
    assert response.status_code == 200
    assert response.json()["pagination"]["total"] == 0
    assert response.json()["data"] == []
    assert api_client.get("/api/departments").json() == []
    assert api_client.get("/api/semesters").json() == []
