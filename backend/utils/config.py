"""
Utility functions for loading configuration and secrets from YAML files.
"""
import logging
import os
from typing import Any, Dict

import yaml

# Compute paths relative to this file's location
# backend/utils/config.py -> backend/utils -> backend -> backend/configs
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_THIS_DIR)
_CONFIGS_DIR = os.path.join(_BACKEND_DIR, "configs")

_DEFAULT_CONFIG_PATH = os.path.join(_CONFIGS_DIR, "config.yaml")
_DEFAULT_SECRETS_PATH = os.path.join(_CONFIGS_DIR, "secrets.yaml")

# Secrets that can also be supplied as environment variables. An environment
# variable wins over secrets.yaml, so production (docker-compose.prod.yml)
# needs no secrets file on disk.
SECRET_KEYS = (
    "SECRET_KEY",
    "SESSION_SAME_SITE",
    "SESSION_HTTPS_ONLY",
    "SESSION_MAX_AGE_SECONDS",
    "DB_USER",
    "DB_PASS",
    "REDIS_URL",
)

# Values that must never sign sessions in production: the old hardcoded
# fallback and the placeholder from secrets.yaml.example.
_PLACEHOLDER_SECRET_KEYS = {"dev_secret_key", "change_me_in_production"}
_MIN_SECRET_KEY_LENGTH = 32
_DEV_SECRET_KEY = "dev_secret_key"


def _load_yaml_file(path: str, name: str) -> Dict[str, Any]:
    """
    Helper to load any YAML file with a consistent error message.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"{name} file not found at: {path}")
    with open(path, "r") as f:
        return yaml.safe_load(f) or {}


def load_config(config_path: str = None) -> Dict[str, Any]:
    """
    Load application configuration from a YAML file.

    Args:
        config_path: Path to the configuration YAML file. Defaults to configs/config.yaml.

    Returns:
        Configuration dict.

    Raises:
        FileNotFoundError: If the config file is not found.
    """
    path = config_path if config_path else _DEFAULT_CONFIG_PATH
    return _load_yaml_file(path, "config.yaml")


def load_secrets(secrets_path: str = None) -> Dict[str, Any]:
    """
    Load application secrets from a YAML file.

    Args:
        secrets_path: Path to the secrets YAML file. Defaults to configs/secrets.yaml.

    Returns:
        Secrets dict, or empty dict if the file doesn't exist (callers fall back to env vars / defaults).
    """
    path = secrets_path if secrets_path else _DEFAULT_SECRETS_PATH
    secrets = _load_yaml_file(path, "secrets.yaml") if os.path.exists(path) else {}

    for key in SECRET_KEYS:
        value = os.environ.get(key)
        if value:
            secrets[key] = value
    return secrets


def is_production() -> bool:
    """True when APP_ENV=production (set by docker-compose.prod.yml)."""
    return os.environ.get("APP_ENV", "development").strip().lower() == "production"


def get_secret_key(secrets: Dict[str, Any]) -> str:
    """Returns the session-signing key.

    In production a real key is required: the app refuses to start rather
    than sign sessions with a guessable key, since anyone who knows it can
    forge any user's session, admins included. Development falls back to a
    fixed key so a fresh checkout runs without any setup.
    """
    key = str(secrets.get("SECRET_KEY") or "").strip()

    if is_production():
        if not key:
            raise RuntimeError("SECRET_KEY is required in production. Set it in .env.")
        if key in _PLACEHOLDER_SECRET_KEYS:
            raise RuntimeError("SECRET_KEY is still a placeholder value. Generate a real one for production.")
        if len(key) < _MIN_SECRET_KEY_LENGTH:
            raise RuntimeError(
                f"SECRET_KEY must be at least {_MIN_SECRET_KEY_LENGTH} characters in production "
                '(python3 -c "import secrets; print(secrets.token_hex(32))").'
            )
        return key

    if not key:
        logging.getLogger(__name__).warning("SECRET_KEY is not set; using the development fallback key.")
        return _DEV_SECRET_KEY
    return key

