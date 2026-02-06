from datetime import timedelta


def exponential_backoff(attempt: int, base_delay: int = 10, max_delay: int = 300) -> timedelta:
    delay_seconds = min(base_delay * (2 ** attempt), max_delay)
    return timedelta(seconds=delay_seconds)
