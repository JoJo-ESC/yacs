import base64
import hashlib
import hmac
import os


PBKDF2_ITERATIONS = 310_000
MAX_PASSWORD_BYTES = 1024
SUPPORTED_ALGORITHM = "pbkdf2_sha256"


def _parse_password_hash(password_hash: str) -> tuple[str, int, bytes, bytes] | None:
    try:
        algorithm, iterations, salt_b64, digest_b64 = password_hash.split("$", 3)
        salt = base64.b64decode(salt_b64.encode("ascii"))
        digest = base64.b64decode(digest_b64.encode("ascii"))
        return algorithm, int(iterations), salt, digest
    except Exception:
        return None


def hash_password(password: str) -> str:
    """Return pbkdf2 hash in the format: pbkdf2_sha256$iterations$salt$hash."""
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError("Password exceeds allowed length.")

    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    salt_b64 = base64.b64encode(salt).decode("ascii")
    digest_b64 = base64.b64encode(digest).decode("ascii")
    return f"{SUPPORTED_ALGORITHM}${PBKDF2_ITERATIONS}${salt_b64}${digest_b64}"


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a stored pbkdf2 hash."""
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        return False

    parsed = _parse_password_hash(password_hash)
    if parsed is None:
        return False

    algorithm, iterations, salt, expected = parsed
    if algorithm != SUPPORTED_ALGORITHM or iterations <= 0:
        return False

    try:
        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password_bytes,
            salt,
            iterations,
        )
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def needs_rehash(password_hash: str) -> bool:
    """Return True when hash params are outdated and should be upgraded on successful login."""
    parsed = _parse_password_hash(password_hash)
    if parsed is None:
        return False

    algorithm, iterations, _, _ = parsed
    return algorithm != SUPPORTED_ALGORITHM or iterations < PBKDF2_ITERATIONS
