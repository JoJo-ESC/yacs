# backend/scraper/schedule.py
"""Run the course sync once a week. This is the `sync` service's command in
docker-compose.prod.yml. Run from backend/:

    python -m scraper.schedule

Syncs every Sunday at 08:00 UTC (3-4 AM Eastern). It doesn't sync at
startup, so deploys and restarts don't add extra scrapes; for fresh data
now, run `python -m scraper.sync`. A failed sync is logged and retried the
next week; it never stops the loop.
"""

import os
import sys
import time
import traceback
from datetime import datetime, timedelta, timezone

# Make `scraper` and `models` importable however this file is run
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from scraper.sync import sync

SYNC_WEEKDAY = 6  # Sunday (Monday is 0)
SYNC_HOUR_UTC = 8

# Sleep in chunks and re-check the clock, so a long sleep can't drift past
# the scheduled time (e.g. after the server's clock is corrected).
MAX_SLEEP_SECONDS = 3600


def next_run(now: datetime) -> datetime:
    """The first Sunday 08:00 UTC strictly after `now` (an aware datetime)."""
    now = now.astimezone(timezone.utc)
    run = now.replace(hour=SYNC_HOUR_UTC, minute=0, second=0, microsecond=0)
    run += timedelta(days=(SYNC_WEEKDAY - now.weekday()) % 7)
    if run <= now:
        run += timedelta(days=7)
    return run


def run_once() -> bool:
    print(f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}] Starting course sync")
    start = time.monotonic()
    try:
        ok = sync()
    except Exception:
        # e.g. SIS9 or the database is down; try again next week
        traceback.print_exc()
        ok = False
    status = "finished" if ok else "FAILED"
    print(f"Course sync {status} in {time.monotonic() - start:.0f}s")
    return ok


def main():
    while True:
        run_at = next_run(datetime.now(timezone.utc))
        print(f"Next sync at {run_at.isoformat(timespec='minutes')}")
        while (remaining := (run_at - datetime.now(timezone.utc)).total_seconds()) > 0:
            time.sleep(min(remaining, MAX_SLEEP_SECONDS))
        run_once()


if __name__ == '__main__':
    main()
