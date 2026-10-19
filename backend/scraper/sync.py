# backend/scraper/sync.py
"""Scrape fresh course data from SIS9 and import it into the database.

One unattended command for scheduled syncing: no session cookie needed.
By default it syncs the active terms (current and next). Run from backend/:

    python -m scraper.sync                 # active terms
    python -m scraper.sync --term 202701   # specific term(s)
"""

import argparse
import os
import sys
import time

# Make `scraper` and `models` importable however this file is run
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from scraper.main import DATA_DIR, SIS9Scraper, scrape_term, term_data_path
from scraper.terms import get_active_term_codes


def sync_data_dir() -> str:
    """Where sync writes its JSON. Production points SYNC_DATA_DIR at a
    writable volume so the read-only repo data (and the server's git
    checkout) are never modified; locally it defaults to scraper/data."""
    return os.environ.get("SYNC_DATA_DIR") or DATA_DIR


def sync(term_codes=None, force: bool = False) -> bool:
    """Scrape and import the given terms (default: active terms).

    Returns True if every requested term synced. A term that fails to
    scrape, or whose scrape looks wrong (see scrape_term), is reported and
    skipped, keeping its existing data; the others are still imported.
    `force` imports suspicious scrapes anyway.
    """
    # Imported here so scraping-only failures don't need a database config
    from models import init_db
    from scraper.import_courses import import_files

    data_dir = sync_data_dir()
    scraper = SIS9Scraper()
    published = {term["code"] for term in scraper.get_terms()}
    requested = sorted(term_codes or get_active_term_codes())
    ok = True

    scraped = []
    for code in requested:
        if code not in published:
            # Normal for the next term before SIS9 publishes it
            print(f"Term {code} isn't published on SIS9 yet; skipping.")
            continue

        print(f"Fetching courses for term {code}...")
        start = time.time()
        try:
            count = scrape_term(scraper, code, data_dir, force=force)
        except Exception as exc:
            print(f"ERROR: Failed to scrape term {code}: {exc}", file=sys.stderr)
            ok = False
            continue
        if count == 0:
            print(f"  Term {code} has no sections on SIS9 yet; skipping.")
            continue
        print(f"  Saved {count} courses ({time.time() - start:.1f}s)")
        scraped.append(code)

    if not scraped:
        print("Nothing to import.")
        return ok

    init_db()
    import_files([os.path.basename(term_data_path(code)) for code in scraped], data_dir)
    return ok


def main():
    parser = argparse.ArgumentParser(description='Scrape SIS9 and import course data into the database')
    parser.add_argument(
        '--term',
        action='append',
        help='Term to sync (e.g., 202701). Repeatable. Defaults to the current and next terms.',
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help="Import even if a scrape is empty or much smaller than the last one (e.g. a term really did shrink).",
    )
    args = parser.parse_args()

    if not sync(args.term, force=args.force):
        sys.exit(1)


if __name__ == '__main__':
    main()
