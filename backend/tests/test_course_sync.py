import models
from scraper import import_courses, sync


class _FakeScraper:
    def get_terms(self):
        return [{"code": "202609"}, {"code": "202605"}]


def _patch(monkeypatch, failing=()):
    scraped, imported = [], []

    def fake_scrape_term(scraper, code):
        if code in failing:
            raise RuntimeError("SIS9 timed out")
        scraped.append(code)
        return 10

    monkeypatch.setattr(sync, "SIS9Scraper", _FakeScraper)
    monkeypatch.setattr(sync, "scrape_term", fake_scrape_term)
    monkeypatch.setattr(models, "init_db", lambda: None)
    monkeypatch.setattr(import_courses, "import_files", lambda files: imported.extend(files))
    return scraped, imported


def test_sync_skips_unpublished_terms(monkeypatch):
    scraped, imported = _patch(monkeypatch)

    assert sync.sync(["202609", "202701"]) is True
    assert scraped == ["202609"]
    assert imported == ["sis9_courses_202609.json"]


def test_sync_imports_remaining_terms_when_one_fails(monkeypatch):
    scraped, imported = _patch(monkeypatch, failing={"202605"})

    assert sync.sync(["202605", "202609"]) is False
    assert imported == ["sis9_courses_202609.json"]


def test_sync_imports_nothing_when_all_fail(monkeypatch):
    scraped, imported = _patch(monkeypatch, failing={"202609"})

    assert sync.sync(["202609"]) is False
    assert imported == []
