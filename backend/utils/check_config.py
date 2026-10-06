"""Startup check run by Dockerfile.prod before uvicorn launches its workers:

    python -m utils.check_config

Uvicorn restarts workers that crash on import forever, so a bad SECRET_KEY
would leave the container "Up" but broken. Checking here first makes it exit
with a clear error instead.
"""
import sys

from utils.config import get_secret_key, load_secrets


def main() -> int:
    try:
        get_secret_key(load_secrets())
    except RuntimeError as err:
        print(f"Configuration error: {err}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
