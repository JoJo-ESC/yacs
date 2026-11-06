import argparse
import requests
import time
import os
import json
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    from .terms import get_active_term_codes
except ImportError:
    from terms import get_active_term_codes

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

# certifi 2026.10.18 dropped the emSign root that sis9.rpi.edu's chain ends
# at, so verifying with requests' default bundle fails. The OS trust stores
# (Debian in the image, macOS locally) still include it, so prefer those.
# SIS9_CA_BUNDLE overrides the choice.
SYSTEM_CA_BUNDLES = (
    "/etc/ssl/certs/ca-certificates.crt",  # Debian/Ubuntu
    "/etc/ssl/cert.pem",                   # macOS
)


def ca_bundle():
    override = os.environ.get("SIS9_CA_BUNDLE")
    if override:
        return override
    for path in SYSTEM_CA_BUNDLES:
        if os.path.exists(path):
            return path
    return True  # requests' default (certifi)


# Seconds to wait for SIS9 to connect / send a response. Without a timeout a
# hung request would stall the weekly sync forever.
REQUEST_TIMEOUT = (10, 60)

# Retry transient failures (connection errors, rate limiting, 5xx) with
# backoff of 2s, 4s, 8s, 16s. Every SIS9 call here is safe to repeat,
# including the POST that selects the term.
RETRY = Retry(
    total=4,
    backoff_factor=2,
    status_forcelist=(429, 500, 502, 503, 504),
    allowed_methods=None,
)

# Refuse to replace a term's data with a scrape this much smaller than the
# last one; a real term never loses half its sections in a week, but a
# broken SIS9 response could.
MIN_FRACTION_OF_PREVIOUS = 0.5


class SIS9ResponseError(RuntimeError):
    """SIS9 returned something other than the expected course data."""


class SuspiciousScrapeError(RuntimeError):
    """A scrape looks wrong compared to the data already saved for the term."""


class SIS9Scraper:
    BASE_URL = "https://sis9.rpi.edu"
    TERMS_PATH = "/StudentRegistrationSsb/ssb/classSearch/getTerms"
    SEARCH_PATH = "/StudentRegistrationSsb/ssb/term/search"
    SEARCH_RESULTS_PATH = "/StudentRegistrationSsb/ssb/searchResults/searchResults"
    TERM_SELECTION_PATH = "/StudentRegistrationSsb/ssb/term/termSelection"

    def __init__(self, session_id: str | None = None):
        self.session = requests.Session()
        self.session.verify = ca_bundle()
        self.session.mount("https://", HTTPAdapter(max_retries=RETRY))
        if session_id:
            self.session.cookies.set("JSESSIONID", session_id, domain="sis9.rpi.edu")
        else:
            self.start_session()

    def start_session(self):
        """Get an anonymous JSESSIONID. Class search doesn't require login,
        so loading the term selection page is enough to get a usable cookie.
        """
        url = self.BASE_URL + self.TERM_SELECTION_PATH
        self.session.cookies.clear()
        response = self.session.get(url=url, params={"mode": "search"}, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        if "JSESSIONID" not in self.session.cookies:
            raise RuntimeError("SIS9 did not return a JSESSIONID cookie")

    def get_terms(self):
        url = self.BASE_URL + self.TERMS_PATH
        params = {"offset": 1, "max": 100}
        response = self.session.get(url=url, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return _json(response)

    def search(self, term: str):
        url = self.BASE_URL + self.SEARCH_PATH
        params = {"mode": "search"}
        data = {
            "term": term,
        }
        response = self.session.post(url=url, params=params, data=data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return _json(response)

    def get_search_results(self, term: str, page_offset: int = 0, page_max_size: int = 500):
        url = self.BASE_URL + self.SEARCH_RESULTS_PATH
        params = {
            "txt_term": term,
            "pageOffset": page_offset,
            "pageMaxSize": page_max_size,
        }
        response = self.session.get(url=url, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return _json(response)

    def get_courses(self, term: str):
        """Fetch every section for a term, checking each page so an expired
        session or error response raises instead of returning partial data."""
        aggregated_results = []
        self.search(term)
        while True:
            results = self.get_search_results(term, page_offset=len(aggregated_results))
            if results.get("success") is False:
                raise SIS9ResponseError(f"SIS9 reported an unsuccessful search for term {term}")
            page = results.get("data") or []
            total = results.get("totalCount") or 0
            if not page:
                if len(aggregated_results) < total:
                    # Without this, an empty page mid-scrape would loop forever
                    raise SIS9ResponseError(
                        f"SIS9 returned an empty page at {len(aggregated_results)}/{total} for term {term}"
                    )
                break
            aggregated_results.extend(page)
            if len(aggregated_results) >= total:
                break

        wrong_term = {row.get("term") for row in aggregated_results} - {term}
        if wrong_term:
            # Banner ties the selected term to the session; a mix-up would
            # otherwise import another term's sections under this one
            raise SIS9ResponseError(f"SIS9 returned sections from term(s) {sorted(wrong_term)} for term {term}")
        return aggregated_results


def _json(response):
    try:
        return response.json()
    except ValueError:
        # e.g. an HTML error or login page instead of JSON
        raise SIS9ResponseError(
            f"SIS9 returned non-JSON from {response.url} (HTTP {response.status_code})"
        ) from None


def term_data_path(code: str, output_dir: str = DATA_DIR) -> str:
    return os.path.join(output_dir, f"sis9_courses_{code}.json")


def _saved_count(path: str):
    """Number of sections in a saved term file, or None if there isn't one."""
    try:
        with open(path, encoding="utf-8") as file:
            return len(json.load(file))
    except (OSError, ValueError):
        return None


def check_scrape(code: str, count: int, previous) -> None:
    """Raise SuspiciousScrapeError if `count` sections looks wrong given the
    `previous` saved count (None if the term has never been saved)."""
    if previous is None:
        return
    if count == 0:
        raise SuspiciousScrapeError(f"Term {code} came back empty (last saved: {previous} sections)")
    if count < previous * MIN_FRACTION_OF_PREVIOUS:
        raise SuspiciousScrapeError(
            f"Term {code} came back with {count} sections, under "
            f"{MIN_FRACTION_OF_PREVIOUS:.0%} of the {previous} last saved"
        )


def scrape_term(scraper: SIS9Scraper, code: str, output_dir: str = DATA_DIR, force: bool = False) -> int:
    """Fetch every section for a term and save it as JSON. Returns the count.

    Writes to a temp file and renames it into place, so a failed or
    interrupted scrape never leaves a half-written file for the importer.
    Raises (leaving the saved file untouched) if the scrape looks wrong
    compared to the last one, unless `force`. A term with no sections that
    was never saved returns 0 without writing anything: SIS9 lists terms
    before their sections are loaded.
    """
    os.makedirs(output_dir, exist_ok=True)
    output_path = term_data_path(code, output_dir)
    try:
        results = scraper.get_courses(code)
    except SIS9ResponseError as exc:
        # Most likely the session expired mid-scrape; retry once with a new one
        print(f"  {exc}; retrying with a new session")
        scraper.start_session()
        results = scraper.get_courses(code)

    previous = _saved_count(output_path)
    if not force:
        check_scrape(code, len(results), previous)
    if not results and previous is None:
        return 0

    tmp_path = output_path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as file:
        json.dump(results, file, indent=4)
    os.replace(tmp_path, output_path)
    return len(results)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--sessionid",
        help="Optional JSESSIONID from sis9.rpi.edu. If omitted, an anonymous session is started automatically.",
    )
    args = parser.parse_args()

    scraper = SIS9Scraper(args.sessionid)
    terms = scraper.get_terms()

    active_terms = get_active_term_codes()
    skipped = 0

    for term in terms:
        code = term["code"]
        if os.path.exists(term_data_path(code)) and code not in active_terms:
            skipped += 1
            continue

        print(f"Fetching courses for term: {term['description']}")
        start = time.time()
        count = scrape_term(scraper, code)
        print(f"  Saved {count} courses ({time.time() - start:.1f}s)")

    if skipped:
        print(f"\nSkipped {skipped} historical term(s) already on disk.")


if __name__ == "__main__":
    main()
