"""Shared helpers for service-layer database queries."""
from typing import Optional


def clean_pagination(skip: int, limit: int) -> tuple[int, int]:
    skip = max(int(skip or 0), 0)
    limit = min(max(int(limit or 10), 1), 100)
    return skip, limit


def clean_string(value: Optional[str], *, lowercase: bool = False) -> Optional[str]:
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None
    return value.lower() if lowercase else value
