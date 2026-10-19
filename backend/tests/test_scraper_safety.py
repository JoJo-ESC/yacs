import json

import pytest

from scraper import main as scraper_main
from scraper.main import (
    SIS9ResponseError,
    SIS9Scraper,
    SuspiciousScrapeError,
    check_scrape,
    scrape_term,
    term_data_path,
)


def _rows(n, term="202609"):
    return [{"id": i, "term": term} for i in range(n)]


class FakeScraper(SIS9Scraper):
    """Serves canned searchResults pages instead of calling SIS9."""

    def __init__(self, pages, total=None):
        self.pages = list(pages)  # each: list of rows, or a full response dict
        self.total = total
        self.sessions_started = 0

    def start_session(self):
        self.sessions_started += 1

    def search(self, term):
        return {}

    def get_search_results(self, term, page_offset=0, page_max_size=500):
        page = self.pages.pop(0)
        if isinstance(page, dict):
            return page
        return {"success": True, "totalCount": self.total, "data": page}


def test_get_courses_pages_through_all_results():
    scraper = FakeScraper([_rows(500), _rows(200)], total=700)
    assert len(scraper.get_courses("202609")) == 700


def test_get_courses_raises_instead_of_looping_on_empty_page():
    scraper = FakeScraper([_rows(500), [], []], total=700)
    with pytest.raises(SIS9ResponseError, match="empty page at 500/700"):
        scraper.get_courses("202609")


def test_get_courses_handles_null_data():
    scraper = FakeScraper([{"success": True, "totalCount": 0, "data": None}])
    assert scraper.get_courses("202609") == []


def test_get_courses_raises_on_unsuccessful_search():
    scraper = FakeScraper([{"success": False}])
    with pytest.raises(SIS9ResponseError, match="unsuccessful"):
        scraper.get_courses("202609")


def test_get_courses_rejects_sections_from_another_term():
    scraper = FakeScraper([_rows(3, term="202605")], total=3)
    with pytest.raises(SIS9ResponseError, match="202605"):
        scraper.get_courses("202609")


def test_non_json_response_raises():
    class HtmlResponse:
        url = "https://sis9.rpi.edu/x"
        status_code = 200

        def json(self):
            raise ValueError("Expecting value")

    with pytest.raises(SIS9ResponseError, match="non-JSON"):
        scraper_main._json(HtmlResponse())


@pytest.mark.parametrize("count, previous", [(100, None), (0, None), (3000, 3111), (1556, 3111)])
def test_check_scrape_accepts(count, previous):
    check_scrape("202609", count, previous)


@pytest.mark.parametrize("count, previous", [(0, 3111), (1555, 3111)])
def test_check_scrape_rejects(count, previous):
    with pytest.raises(SuspiciousScrapeError):
        check_scrape("202609", count, previous)


def _save(tmp_path, n):
    with open(term_data_path("202609", str(tmp_path)), "w") as f:
        json.dump(_rows(n), f)


def _saved(tmp_path):
    with open(term_data_path("202609", str(tmp_path))) as f:
        return len(json.load(f))


def test_scrape_term_keeps_saved_data_when_scrape_shrinks(tmp_path):
    _save(tmp_path, 3000)
    with pytest.raises(SuspiciousScrapeError):
        scrape_term(FakeScraper([_rows(10)], total=10), "202609", str(tmp_path))
    assert _saved(tmp_path) == 3000


def test_scrape_term_force_overrides_check(tmp_path):
    _save(tmp_path, 3000)
    assert scrape_term(FakeScraper([_rows(10)], total=10), "202609", str(tmp_path), force=True) == 10
    assert _saved(tmp_path) == 10


def test_scrape_term_skips_unloaded_new_term_without_writing(tmp_path):
    assert scrape_term(FakeScraper([[]], total=0), "202609", str(tmp_path)) == 0
    assert not (tmp_path / "sis9_courses_202609.json").exists()


def test_scrape_term_retries_once_with_new_session(tmp_path):
    scraper = FakeScraper([{"success": False}, _rows(5)], total=5)
    assert scrape_term(scraper, "202609", str(tmp_path)) == 5
    assert scraper.sessions_started == 1
