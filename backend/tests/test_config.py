"""Verifies secrets can come from environment variables, and that production
refuses to start with a missing or guessable SECRET_KEY.

Run with: /path/to/venv/bin/python -m pytest backend/tests/test_config.py
"""
import pytest

from utils import config

REAL_KEY = "a" * 64


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    for key in (*config.SECRET_KEYS, "APP_ENV"):
        monkeypatch.delenv(key, raising=False)


@pytest.fixture
def secrets_file(tmp_path):
    path = tmp_path / "secrets.yaml"
    path.write_text('SECRET_KEY: "from-file"\nDB_PASS: "file-pass"\n')
    return str(path)


def test_env_var_overrides_secrets_file(monkeypatch, secrets_file):
    monkeypatch.setenv("SECRET_KEY", "from-env")

    secrets = config.load_secrets(secrets_file)

    assert secrets["SECRET_KEY"] == "from-env"
    assert secrets["DB_PASS"] == "file-pass"


def test_env_vars_work_without_a_secrets_file(monkeypatch, tmp_path):
    monkeypatch.setenv("SECRET_KEY", "from-env")

    secrets = config.load_secrets(str(tmp_path / "missing.yaml"))

    assert secrets == {"SECRET_KEY": "from-env"}


def test_development_falls_back_to_dev_key():
    assert config.get_secret_key({}) == "dev_secret_key"


@pytest.mark.parametrize(
    "key, message",
    [
        (None, "required"),
        ("", "required"),
        ("dev_secret_key", "placeholder"),
        ("change_me_in_production", "placeholder"),
        ("too-short", "at least 32"),
    ],
)
def test_production_rejects_missing_or_weak_keys(monkeypatch, key, message):
    monkeypatch.setenv("APP_ENV", "production")

    with pytest.raises(RuntimeError, match=message):
        config.get_secret_key({"SECRET_KEY": key})


def test_production_accepts_a_real_key(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")

    assert config.get_secret_key({"SECRET_KEY": REAL_KEY}) == REAL_KEY
