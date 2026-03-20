from datetime import date


def get_active_term_codes() -> set:
    """Return term codes for the current and next term.

    These are always re-fetched/re-imported since enrollment data changes
    while registration is open. All other terms are skipped if local data
    already exists.
    """
    today = date.today()
    year = today.year
    month = today.month

    if month <= 5:
        current = f"{year}01"       # Spring
        next_term = f"{year}05"     # Summer
    elif month <= 8:
        current = f"{year}05"       # Summer
        next_term = f"{year}09"     # Fall
    else:
        current = f"{year}09"       # Fall
        next_term = f"{year + 1}01" # Spring next year

    return {current, next_term}
