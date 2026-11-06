import models
from scraper import import_courses, sync


class _FakeScraper:
    def get_terms(self):
        return [{"code": "202609"}, {"code": "202605"}]


def _patch(monkeypatch, failing=()):
    scraped, imported = [], []

    def fake_scrape_term(scraper, code, output_dir, force=False):
        if code in failing:
            raise RuntimeError("SIS9 timed out")
        scraped.append(code)
        return 10

    monkeypatch.setattr(sync, "SIS9Scraper", _FakeScraper)
    monkeypatch.setattr(sync, "scrape_term", fake_scrape_term)
    monkeypatch.setattr(models, "init_db", lambda: None)
    monkeypatch.setattr(import_courses, "import_files", lambda files, data_dir, prune=False: imported.extend(files))
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


def test_sync_writes_to_sync_data_dir(monkeypatch, tmp_path):
    monkeypatch.setenv("SYNC_DATA_DIR", str(tmp_path))
    dirs = []
    monkeypatch.setattr(sync, "SIS9Scraper", _FakeScraper)
    monkeypatch.setattr(sync, "scrape_term", lambda scraper, code, output_dir, force=False: dirs.append(output_dir) or 10)
    monkeypatch.setattr(models, "init_db", lambda: None)
    monkeypatch.setattr(import_courses, "import_files", lambda files, data_dir, prune=False: dirs.append(data_dir))

    assert sync.sync(["202609"]) is True
    assert dirs == [str(tmp_path), str(tmp_path)]


def test_sync_prunes_removed_sections(monkeypatch):
    _patch(monkeypatch)
    calls = []
    monkeypatch.setattr(import_courses, "import_files", lambda files, data_dir, prune=False: calls.append(prune))

    assert sync.sync(["202609"]) is True
    assert calls == [True]
