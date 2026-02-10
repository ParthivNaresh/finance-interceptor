from __future__ import annotations

from dataclasses import dataclass
from datetime import date

SEASONAL_CATEGORIES: dict[str, frozenset[int]] = {
    "TRAVEL": frozenset({6, 7, 8, 12}),
    "GENERAL_MERCHANDISE": frozenset({11, 12}),
    "ENTERTAINMENT": frozenset({6, 7, 8, 12}),
}

HOLIDAY_MONTHS: frozenset[int] = frozenset({11, 12})
SUMMER_MONTHS: frozenset[int] = frozenset({6, 7, 8})


@dataclass(frozen=True, slots=True)
class SeasonalityInfo:
    is_seasonal: bool
    seasonal_months: tuple[int, ...] | None
    reason: str | None


def get_seasonal_months(category: str) -> frozenset[int] | None:
    return SEASONAL_CATEGORIES.get(category.upper())


def is_seasonal_period(category: str, month: int) -> bool:
    seasonal_months = get_seasonal_months(category)
    if seasonal_months is None:
        return False
    return month in seasonal_months


def detect_seasonality(category: str, period_start: date) -> SeasonalityInfo:
    month = period_start.month
    seasonal_months = get_seasonal_months(category)

    if seasonal_months is None:
        return SeasonalityInfo(
            is_seasonal=False,
            seasonal_months=None,
            reason=None,
        )

    if month not in seasonal_months:
        return SeasonalityInfo(
            is_seasonal=False,
            seasonal_months=tuple(sorted(seasonal_months)),
            reason=None,
        )

    if month in HOLIDAY_MONTHS:
        reason = "holiday_season"
    elif month in SUMMER_MONTHS:
        reason = "summer_season"
    else:
        reason = "seasonal_pattern"

    return SeasonalityInfo(
        is_seasonal=True,
        seasonal_months=tuple(sorted(seasonal_months)),
        reason=reason,
    )


def is_holiday_month(month: int) -> bool:
    return month in HOLIDAY_MONTHS


def is_summer_month(month: int) -> bool:
    return month in SUMMER_MONTHS
