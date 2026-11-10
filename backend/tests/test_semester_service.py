"""Lightweight verification for semester discovery and config overrides.

Run from the repository root with:
    python3 backend/tests/test_semester_service.py
"""

import importlib.util
import pathlib
import sys
import types

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

utils_stub = types.ModuleType("utils")
utils_stub.load_config = lambda: {}
sys.modules["utils"] = utils_stub


def load_module_as(name: str, path: pathlib.Path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


semester_service = load_module_as("semester_service", BACKEND_DIR / "services" / "semester_service.py")


def assert_equal(left, right, message: str):
    if left != right:
        raise AssertionError(f"{message}: expected {right!r}, got {left!r}")


def main():
    discovered = semester_service.discover_semesters_from_files()
    if not discovered:
        raise AssertionError("Expected at least one discovered semester from scraper data")

    assert_equal(discovered[0]["id"], "202601", "Newest discovered term code should sort first")
    assert_equal(discovered[0]["name"], "Spring 2026", "Discovered term label should be human-readable")

    configured = semester_service.list_semesters(
        {
            "SEMESTERS": [
                {"id": "202609", "name": "Fall 2026"},
                {"term": "202701", "termDesc": "Spring 2027"},
            ]
        }
    )
    assert_equal(
        configured,
        [
            {"id": "202701", "name": "Spring 2027", "source": "config"},
            {"id": "202609", "name": "Fall 2026", "source": "config"},
        ],
        "Configured semesters should override discovery and sort newest first",
    )

    print("SUCCESS: semester_service discovers and overrides semesters correctly")


if __name__ == "__main__":
    main()
