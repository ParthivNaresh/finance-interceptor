from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta

from models.enums import PeriodType


def get_period_bounds(target_date: date, period_type: PeriodType) -> tuple[date, date]:
    if period_type == PeriodType.DAILY:
        return target_date, target_date

    if period_type == PeriodType.WEEKLY:
        start = target_date - timedelta(days=target_date.weekday())
        end = start + timedelta(days=6)
        return start, end

    if period_type == PeriodType.MONTHLY:
        start = target_date.replace(day=1)
        _, last_day = monthrange(target_date.year, target_date.month)
        end = target_date.replace(day=last_day)
        return start, end

    if period_type == PeriodType.YEARLY:
        start = target_date.replace(month=1, day=1)
        end = target_date.replace(month=12, day=31)
        return start, end

    raise ValueError(f"Unknown period type: {period_type}")


def get_current_period_start(period_type: PeriodType) -> date:
    today = date.today()
    start, _ = get_period_bounds(today, period_type)
    return start


def get_previous_period_start(period_start: date, period_type: PeriodType) -> date:
    if period_type == PeriodType.DAILY:
        return period_start - timedelta(days=1)

    if period_type == PeriodType.WEEKLY:
        return period_start - timedelta(weeks=1)

    if period_type == PeriodType.MONTHLY:
        if period_start.month == 1:
            return period_start.replace(year=period_start.year - 1, month=12)
        return period_start.replace(month=period_start.month - 1)

    if period_type == PeriodType.YEARLY:
        return period_start.replace(year=period_start.year - 1)

    raise ValueError(f"Unknown period type: {period_type}")


def get_next_period_start(period_start: date, period_type: PeriodType) -> date:
    if period_type == PeriodType.DAILY:
        return period_start + timedelta(days=1)

    if period_type == PeriodType.WEEKLY:
        return period_start + timedelta(weeks=1)

    if period_type == PeriodType.MONTHLY:
        if period_start.month == 12:
            return period_start.replace(year=period_start.year + 1, month=1)
        return period_start.replace(month=period_start.month + 1)

    if period_type == PeriodType.YEARLY:
        return period_start.replace(year=period_start.year + 1)

    raise ValueError(f"Unknown period type: {period_type}")


def is_period_finalized(period_start: date, period_type: PeriodType) -> bool:
    _, period_end = get_period_bounds(period_start, period_type)
    return date.today() > period_end


def get_periods_in_range(
    start_date: date,
    end_date: date,
    period_type: PeriodType,
) -> list[date]:
    periods: list[date] = []
    current_start, _ = get_period_bounds(start_date, period_type)

    while current_start <= end_date:
        periods.append(current_start)
        current_start = get_next_period_start(current_start, period_type)

    return periods


def get_months_between(start_date: date, end_date: date) -> int:
    return (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)


def get_period_label(period_start: date, period_type: PeriodType) -> str:
    if period_type == PeriodType.DAILY:
        return period_start.strftime("%b %d, %Y")

    if period_type == PeriodType.WEEKLY:
        _, period_end = get_period_bounds(period_start, period_type)
        return f"{period_start.strftime('%b %d')} - {period_end.strftime('%b %d, %Y')}"

    if period_type == PeriodType.MONTHLY:
        return period_start.strftime("%B %Y")

    if period_type == PeriodType.YEARLY:
        return str(period_start.year)

    raise ValueError(f"Unknown period type: {period_type}")
