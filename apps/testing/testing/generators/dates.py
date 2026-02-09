from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Literal


@dataclass
class DateRange:
    start: date
    end: date

    def __post_init__(self) -> None:
        if self.start > self.end:
            raise ValueError(f"start ({self.start}) must be <= end ({self.end})")

    @property
    def days(self) -> int:
        return (self.end - self.start).days + 1

    def contains(self, d: date) -> bool:
        return self.start <= d <= self.end

    def random_date(self, rng: random.Random | None = None) -> date:
        r = rng or random.Random()
        days_offset = r.randint(0, self.days - 1)
        return self.start + timedelta(days=days_offset)


def months_ago(n: int, from_date: date | None = None) -> date:
    reference = from_date or date.today()
    year = reference.year
    month = reference.month - n

    while month <= 0:
        month += 12
        year -= 1

    day = min(reference.day, _days_in_month(year, month))
    return date(year, month, day)


def days_ago(n: int, from_date: date | None = None) -> date:
    reference = from_date or date.today()
    return reference - timedelta(days=n)


def get_period_range(
    months_back: int,
    period_type: Literal["monthly", "weekly", "daily"] = "monthly",
    from_date: date | None = None,
) -> DateRange:
    reference = from_date or date.today()

    if period_type == "monthly":
        start = _first_of_month(months_ago(months_back, reference))
        end = _last_of_month(months_ago(months_back, reference))
    elif period_type == "weekly":
        target = reference - timedelta(weeks=months_back)
        start = target - timedelta(days=target.weekday())
        end = start + timedelta(days=6)
    else:
        target = reference - timedelta(days=months_back)
        start = target
        end = target

    return DateRange(start=start, end=end)


def generate_transaction_dates(
    date_range: DateRange,
    count: int,
    distribution: Literal["uniform", "weighted_recent", "clustered"] = "uniform",
    seed: int | None = None,
) -> list[date]:
    if count <= 0:
        return []

    rng = random.Random(seed)
    dates: list[date] = []

    if distribution == "uniform":
        dates = _generate_uniform_dates(date_range, count, rng)
    elif distribution == "weighted_recent":
        dates = _generate_weighted_recent_dates(date_range, count, rng)
    elif distribution == "clustered":
        dates = _generate_clustered_dates(date_range, count, rng)

    return sorted(dates)


def generate_recurring_dates(
    start_date: date,
    frequency: Literal["weekly", "biweekly", "monthly", "quarterly", "annually"],
    count: int,
    jitter_days: int = 0,
    seed: int | None = None,
) -> list[date]:
    if count <= 0:
        return []

    rng = random.Random(seed)
    dates: list[date] = []
    current = start_date

    for _ in range(count):
        if jitter_days > 0:
            jitter = rng.randint(-jitter_days, jitter_days)
            actual_date = current + timedelta(days=jitter)
        else:
            actual_date = current

        dates.append(actual_date)
        current = _advance_by_frequency(current, frequency)

    return dates


def _generate_uniform_dates(
    date_range: DateRange, count: int, rng: random.Random
) -> list[date]:
    if count >= date_range.days:
        return [date_range.start + timedelta(days=i) for i in range(date_range.days)]

    selected_offsets = rng.sample(range(date_range.days), count)
    return [date_range.start + timedelta(days=offset) for offset in selected_offsets]


def _generate_weighted_recent_dates(
    date_range: DateRange, count: int, rng: random.Random
) -> list[date]:
    dates: list[date] = []
    total_days = date_range.days

    for _ in range(count):
        weight = rng.random() ** 0.5
        days_offset = int(weight * (total_days - 1))
        dates.append(date_range.start + timedelta(days=days_offset))

    return dates


def _generate_clustered_dates(
    date_range: DateRange, count: int, rng: random.Random
) -> list[date]:
    dates: list[date] = []
    total_days = date_range.days

    num_clusters = max(1, count // 4)
    cluster_centers = [rng.randint(0, total_days - 1) for _ in range(num_clusters)]

    for _ in range(count):
        center = rng.choice(cluster_centers)
        spread = rng.gauss(0, 3)
        days_offset = max(0, min(total_days - 1, int(center + spread)))
        dates.append(date_range.start + timedelta(days=days_offset))

    return dates


def _advance_by_frequency(
    current: date,
    frequency: Literal["weekly", "biweekly", "monthly", "quarterly", "annually"],
) -> date:
    if frequency == "weekly":
        return current + timedelta(weeks=1)
    elif frequency == "biweekly":
        return current + timedelta(weeks=2)
    elif frequency == "monthly":
        return _add_months(current, 1)
    elif frequency == "quarterly":
        return _add_months(current, 3)
    elif frequency == "annually":
        return _add_months(current, 12)
    else:
        raise ValueError(f"Unknown frequency: {frequency}")


def _add_months(d: date, months: int) -> date:
    year = d.year
    month = d.month + months

    while month > 12:
        month -= 12
        year += 1

    day = min(d.day, _days_in_month(year, month))
    return date(year, month, day)


def _first_of_month(d: date) -> date:
    return date(d.year, d.month, 1)


def _last_of_month(d: date) -> date:
    return date(d.year, d.month, _days_in_month(d.year, d.month))


def _days_in_month(year: int, month: int) -> int:
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    return (next_month - date(year, month, 1)).days
