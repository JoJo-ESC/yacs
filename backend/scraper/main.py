import argparse
import requests
import time
import os
import json

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


class SIS9Scraper:
    BASE_URL = "https://sis9.rpi.edu"
    TERMS_PATH = "/StudentRegistrationSsb/ssb/classSearch/getTerms"
    SEARCH_PATH = "/StudentRegistrationSsb/ssb/term/search"
    SEARCH_RESULTS_PATH = "/StudentRegistrationSsb/ssb/searchResults/searchResults"
    TERM_SELECTION_PATH = "/StudentRegistrationSsb/ssb/term/termSelection"

    def __init__(self, session_id: str | None = None):
        self.session = requests.Session()
        self.session.verify = ca_bundle()
        if session_id:
            self.session.cookies.set("JSESSIONID", session_id, domain="sis9.rpi.edu")
        else:
            self.start_session()

    def start_session(self):
        """Get an anonymous JSESSIONID. Class search doesn't require login,
        so loading the term selection page is enough to get a usable cookie.
        """
        url = self.BASE_URL + self.TERM_SELECTION_PATH
        response = self.session.get(url=url, params={"mode": "search"})
        response.raise_for_status()
        if "JSESSIONID" not in self.session.cookies:
            raise RuntimeError("SIS9 did not return a JSESSIONID cookie")

    def get_terms(self):
        url = self.BASE_URL + self.TERMS_PATH
        params = {"offset": 1, "max": 100}
        response = self.session.get(url=url, params=params)
        response.raise_for_status()
        return response.json()
    
    def search(self, term: str):
        url = self.BASE_URL + self.SEARCH_PATH
        params = {"mode": "search"}
        data = {
            "term": term,
        }
        response = self.session.post(url=url, params=params, data=data)
        response.raise_for_status()
        return response.json()

    def get_search_results(self, term: str, page_offset: int = 0, page_max_size: int = 500):
        url = self.BASE_URL + self.SEARCH_RESULTS_PATH
        params = {
            "txt_term": term,
            "pageOffset": page_offset,
            "pageMaxSize": page_max_size,
        }
        response = self.session.get(url=url, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_courses(self, term: str):
        offset = 0
        max_point = 0
        aggregated_results = []
        self.search(term)
        while True:
            results = self.get_search_results(term, page_offset=offset)
            offset = offset + len(results.get("data", []))
            max_point = results.get("totalCount", 0)
            aggregated_results.extend(results.get("data", []))
            if offset >= max_point:
                break
        return aggregated_results


def term_data_path(code: str, output_dir: str = DATA_DIR) -> str:
    return os.path.join(output_dir, f"sis9_courses_{code}.json")


def scrape_term(scraper: SIS9Scraper, code: str, output_dir: str = DATA_DIR) -> int:
    """Fetch every section for a term and save it as JSON. Returns the count.

    Writes to a temp file and renames it into place, so a failed or
    interrupted scrape never leaves a half-written file for the importer.
    """
    os.makedirs(output_dir, exist_ok=True)
    output_path = term_data_path(code, output_dir)
    results = scraper.get_courses(code)
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
