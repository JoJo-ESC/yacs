from datetime import datetime, timezone

from scraper import schedule


def _utc(*args):
    return datetime(*args, tzinfo=timezone.utc)


def test_next_run_is_the_coming_sunday():
    # Monday 2026-10-19 -> Sunday 2026-10-25 08:00 UTC
    assert schedule.next_run(_utc(2026, 10, 19, 12, 0)) == _utc(2026, 10, 25, 8, 0)


def test_next_run_later_the_same_sunday():
    assert schedule.next_run(_utc(2026, 10, 25, 7, 59)) == _utc(2026, 10, 25, 8, 0)


def test_next_run_skips_to_next_week_once_sunday_run_has_passed():
    assert schedule.next_run(_utc(2026, 10, 25, 8, 0)) == _utc(2026, 11, 1, 8, 0)
    assert schedule.next_run(_utc(2026, 10, 25, 20, 0)) == _utc(2026, 11, 1, 8, 0)


def test_run_once_survives_a_crashing_sync(monkeypatch):
    def boom():
        raise ConnectionError("SIS9 is down")

    monkeypatch.setattr(schedule, "sync", boom)
    assert schedule.run_once() is False
