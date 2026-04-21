import argparse
import requests
import time
import os
import json
from terms import get_active_term_codes


class SIS9Scraper:
    BASE_URL = "https://sis9.rpi.edu"
    TERMS_PATH = "/StudentRegistrationSsb/ssb/classSearch/getTerms"
    SEARCH_PATH = "/StudentRegistrationSsb/ssb/term/search"
    SEARCH_RESULTS_PATH = "/StudentRegistrationSsb/ssb/searchResults/searchResults"

    def __init__(self, session_id: str):
        self.session = requests.Session()
        self.session.cookies.set("JSESSIONID", session_id, domain="sis9.rpi.edu")

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



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--sessionid",
        required=True,
        help="Cookie string (JSESSIONID found on sis9.rpi.edu)",
    )
    args = parser.parse_args()

    scraper = SIS9Scraper(args.sessionid)
    terms = scraper.get_terms()
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(output_dir, exist_ok=True)

    active_terms = get_active_term_codes()
    skipped = 0

    for term in terms:
        code = term["code"]
        output_path = os.path.join(output_dir, f"sis9_courses_{code}.json")

        if os.path.exists(output_path) and code not in active_terms:
            skipped += 1
            continue

        print(f"Fetching courses for term: {term['description']}")
        start = time.time()
        results = scraper.get_courses(code)
        with open(output_path, "w", encoding="utf-8") as file:
            json.dump(results, file, indent=4)
        print(f"  Saved {len(results)} courses ({time.time() - start:.1f}s)")

    if skipped:
        print(f"\nSkipped {skipped} historical term(s) already on disk.")


if __name__ == "__main__":
    main()
