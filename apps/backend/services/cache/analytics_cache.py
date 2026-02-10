from __future__ import annotations

from datetime import date
from typing import ClassVar
from uuid import UUID

from models.analytics import (
    CashFlowMetricsListResponse,
    CashFlowMetricsResponse,
    CategoryBreakdownResponse,
    IncomeSourceListResponse,
    LifestyleBaselineListResponse,
    LifestyleCreepListResponse,
    LifestyleCreepSummary,
    MerchantBreakdownResponse,
    MerchantStatsListResponse,
    PacingResponse,
    SpendingSummaryListResponse,
    SpendingSummaryResponse,
    TargetStatusResponse,
)
from observability import get_logger
from services.cache.base import CacheService, get_cache_service

logger = get_logger("services.cache.analytics")


class AnalyticsCache:
    _DOMAIN: ClassVar[str] = "analytics"

    def __init__(
        self,
        cache_service: CacheService,
        *,
        current_ttl: int = 120,
        historical_ttl: int = 3600,
        finalized_ttl: int = 86400,
        merchant_stats_ttl: int = 600,
        pacing_ttl: int = 60,
        baselines_ttl: int = 3600,
        baselines_locked_ttl: int = 86400,
        creep_ttl: int = 300,
    ) -> None:
        self._cache = cache_service
        self._current_ttl = current_ttl
        self._historical_ttl = historical_ttl
        self._finalized_ttl = finalized_ttl
        self._merchant_stats_ttl = merchant_stats_ttl
        self._pacing_ttl = pacing_ttl
        self._baselines_ttl = baselines_ttl
        self._baselines_locked_ttl = baselines_locked_ttl
        self._creep_ttl = creep_ttl

    def _key(self, user_id: UUID, *parts: str) -> str:
        return self._cache._build_key(self._DOMAIN, str(user_id), *parts)

    def _period_ttl(self, period_start: date) -> int:
        """Select TTL based on how old the period is.

        Current month: _current_ttl (changes with every sync).
        Previous month: _historical_ttl (might get late transactions).
        Older months: _finalized_ttl (data is immutable).
        """
        today = date.today()
        if period_start.year == today.year and period_start.month == today.month:
            return self._current_ttl
        months_ago = (today.year * 12 + today.month) - (
            period_start.year * 12 + period_start.month
        )
        if months_ago == 1:
            return self._historical_ttl
        return self._finalized_ttl

    # --- Spending ---

    def get_current_spending(
        self, user_id: UUID, period_type: str
    ) -> SpendingSummaryResponse | None:
        raw = self._cache.get(self._key(user_id, "spending", "current", period_type))
        if raw is None:
            return None
        try:
            return SpendingSummaryResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_current_spending(
        self, user_id: UUID, period_type: str, response: SpendingSummaryResponse
    ) -> bool:
        key = self._key(user_id, "spending", "current", period_type)
        return self._cache.set(key, response.model_dump_json().encode(), self._current_ttl)

    def get_spending_list(
        self, user_id: UUID, period_type: str, periods: int
    ) -> SpendingSummaryListResponse | None:
        raw = self._cache.get(
            self._key(user_id, "spending", "list", period_type, str(periods))
        )
        if raw is None:
            return None
        try:
            return SpendingSummaryListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_spending_list(
        self,
        user_id: UUID,
        period_type: str,
        periods: int,
        response: SpendingSummaryListResponse,
    ) -> bool:
        key = self._key(user_id, "spending", "list", period_type, str(periods))
        return self._cache.set(key, response.model_dump_json().encode(), self._current_ttl)

    def get_category_breakdown(
        self, user_id: UUID, period_type: str, period_start: date
    ) -> CategoryBreakdownResponse | None:
        raw = self._cache.get(
            self._key(user_id, "spending", "categories", period_type, str(period_start))
        )
        if raw is None:
            return None
        try:
            return CategoryBreakdownResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_category_breakdown(
        self,
        user_id: UUID,
        period_type: str,
        period_start: date,
        response: CategoryBreakdownResponse,
    ) -> bool:
        key = self._key(user_id, "spending", "categories", period_type, str(period_start))
        ttl = self._period_ttl(period_start)
        return self._cache.set(key, response.model_dump_json().encode(), ttl)

    def get_merchant_breakdown(
        self, user_id: UUID, period_type: str, period_start: date, limit: int
    ) -> MerchantBreakdownResponse | None:
        raw = self._cache.get(
            self._key(
                user_id, "spending", "merchants", period_type, str(period_start), str(limit)
            )
        )
        if raw is None:
            return None
        try:
            return MerchantBreakdownResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_merchant_breakdown(
        self,
        user_id: UUID,
        period_type: str,
        period_start: date,
        limit: int,
        response: MerchantBreakdownResponse,
    ) -> bool:
        key = self._key(
            user_id, "spending", "merchants", period_type, str(period_start), str(limit)
        )
        ttl = self._period_ttl(period_start)
        return self._cache.set(key, response.model_dump_json().encode(), ttl)

    # --- Merchant Stats ---

    def get_merchant_stats_top(
        self, user_id: UUID, sort_by: str, limit: int
    ) -> MerchantStatsListResponse | None:
        raw = self._cache.get(
            self._key(user_id, "merchant_stats", "top", sort_by, str(limit))
        )
        if raw is None:
            return None
        try:
            return MerchantStatsListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_merchant_stats_top(
        self, user_id: UUID, sort_by: str, limit: int, response: MerchantStatsListResponse
    ) -> bool:
        key = self._key(user_id, "merchant_stats", "top", sort_by, str(limit))
        return self._cache.set(key, response.model_dump_json().encode(), self._merchant_stats_ttl)

    def get_merchant_stats_list(
        self, user_id: UUID, sort_by: str, limit: int, offset: int
    ) -> MerchantStatsListResponse | None:
        raw = self._cache.get(
            self._key(user_id, "merchant_stats", "list", sort_by, str(limit), str(offset))
        )
        if raw is None:
            return None
        try:
            return MerchantStatsListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_merchant_stats_list(
        self,
        user_id: UUID,
        sort_by: str,
        limit: int,
        offset: int,
        response: MerchantStatsListResponse,
    ) -> bool:
        key = self._key(user_id, "merchant_stats", "list", sort_by, str(limit), str(offset))
        return self._cache.set(key, response.model_dump_json().encode(), self._merchant_stats_ttl)

    def get_recurring_merchants(
        self, user_id: UUID, limit: int
    ) -> MerchantStatsListResponse | None:
        raw = self._cache.get(
            self._key(user_id, "merchant_stats", "recurring", str(limit))
        )
        if raw is None:
            return None
        try:
            return MerchantStatsListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_recurring_merchants(
        self, user_id: UUID, limit: int, response: MerchantStatsListResponse
    ) -> bool:
        key = self._key(user_id, "merchant_stats", "recurring", str(limit))
        return self._cache.set(key, response.model_dump_json().encode(), self._merchant_stats_ttl)

    # --- Cash Flow ---

    def get_cashflow_current(self, user_id: UUID) -> CashFlowMetricsResponse | None:
        raw = self._cache.get(self._key(user_id, "cashflow", "current"))
        if raw is None:
            return None
        try:
            return CashFlowMetricsResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_cashflow_current(
        self, user_id: UUID, response: CashFlowMetricsResponse
    ) -> bool:
        key = self._key(user_id, "cashflow", "current")
        return self._cache.set(key, response.model_dump_json().encode(), self._current_ttl)

    def get_cashflow_list(
        self, user_id: UUID, periods: int
    ) -> CashFlowMetricsListResponse | None:
        raw = self._cache.get(self._key(user_id, "cashflow", "list", str(periods)))
        if raw is None:
            return None
        try:
            return CashFlowMetricsListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_cashflow_list(
        self, user_id: UUID, periods: int, response: CashFlowMetricsListResponse
    ) -> bool:
        key = self._key(user_id, "cashflow", "list", str(periods))
        return self._cache.set(key, response.model_dump_json().encode(), self._current_ttl)

    def get_income_sources(
        self, user_id: UUID, active_only: bool
    ) -> IncomeSourceListResponse | None:
        raw = self._cache.get(
            self._key(user_id, "income_sources", str(active_only).lower())
        )
        if raw is None:
            return None
        try:
            return IncomeSourceListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_income_sources(
        self, user_id: UUID, active_only: bool, response: IncomeSourceListResponse
    ) -> bool:
        key = self._key(user_id, "income_sources", str(active_only).lower())
        return self._cache.set(key, response.model_dump_json().encode(), self._historical_ttl)

    # --- Lifestyle Creep ---

    def get_pacing(self, user_id: UUID) -> PacingResponse | None:
        raw = self._cache.get(self._key(user_id, "creep", "pacing"))
        if raw is None:
            return None
        try:
            return PacingResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_pacing(self, user_id: UUID, response: PacingResponse) -> bool:
        key = self._key(user_id, "creep", "pacing")
        return self._cache.set(key, response.model_dump_json().encode(), self._pacing_ttl)

    def get_target_status(self, user_id: UUID) -> TargetStatusResponse | None:
        raw = self._cache.get(self._key(user_id, "creep", "target_status"))
        if raw is None:
            return None
        try:
            return TargetStatusResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_target_status(self, user_id: UUID, response: TargetStatusResponse) -> bool:
        key = self._key(user_id, "creep", "target_status")
        return self._cache.set(key, response.model_dump_json().encode(), self._creep_ttl)

    def get_baselines(self, user_id: UUID) -> LifestyleBaselineListResponse | None:
        raw = self._cache.get(self._key(user_id, "creep", "baselines"))
        if raw is None:
            return None
        try:
            return LifestyleBaselineListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_baselines(
        self, user_id: UUID, response: LifestyleBaselineListResponse, is_locked: bool
    ) -> bool:
        key = self._key(user_id, "creep", "baselines")
        ttl = self._baselines_locked_ttl if is_locked else self._baselines_ttl
        return self._cache.set(key, response.model_dump_json().encode(), ttl)

    def get_creep_summary(
        self, user_id: UUID, period_start: date
    ) -> LifestyleCreepSummary | None:
        raw = self._cache.get(
            self._key(user_id, "creep", "summary", str(period_start))
        )
        if raw is None:
            return None
        try:
            return LifestyleCreepSummary.model_validate_json(raw)
        except Exception:
            return None

    def set_creep_summary(
        self, user_id: UUID, period_start: date, response: LifestyleCreepSummary
    ) -> bool:
        key = self._key(user_id, "creep", "summary", str(period_start))
        return self._cache.set(key, response.model_dump_json().encode(), self._creep_ttl)

    def get_creep_history(
        self, user_id: UUID, periods: int
    ) -> LifestyleCreepListResponse | None:
        raw = self._cache.get(self._key(user_id, "creep", "history", str(periods)))
        if raw is None:
            return None
        try:
            return LifestyleCreepListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_creep_history(
        self, user_id: UUID, periods: int, response: LifestyleCreepListResponse
    ) -> bool:
        key = self._key(user_id, "creep", "history", str(periods))
        return self._cache.set(key, response.model_dump_json().encode(), self._creep_ttl)

    # --- Invalidation ---

    def invalidate_all_for_user(self, user_id: UUID) -> int:
        pattern = self._cache._build_key(self._DOMAIN, str(user_id), "*")
        return self._cache.delete_pattern(pattern)

    def invalidate_spending_for_user(self, user_id: UUID) -> int:
        pattern = self._cache._build_key(self._DOMAIN, str(user_id), "spending", "*")
        return self._cache.delete_pattern(pattern)

    def invalidate_merchant_stats_for_user(self, user_id: UUID) -> int:
        pattern = self._cache._build_key(self._DOMAIN, str(user_id), "merchant_stats", "*")
        return self._cache.delete_pattern(pattern)

    def invalidate_cashflow_for_user(self, user_id: UUID) -> int:
        pattern = self._cache._build_key(self._DOMAIN, str(user_id), "cashflow", "*")
        count = self._cache.delete_pattern(pattern)
        income_pattern = self._cache._build_key(
            self._DOMAIN, str(user_id), "income_sources", "*"
        )
        count += self._cache.delete_pattern(income_pattern)
        return count

    def invalidate_creep_for_user(self, user_id: UUID) -> int:
        pattern = self._cache._build_key(self._DOMAIN, str(user_id), "creep", "*")
        return self._cache.delete_pattern(pattern)


class AnalyticsCacheContainer:
    _instance: AnalyticsCache | None = None

    @classmethod
    def get(cls) -> AnalyticsCache:
        if cls._instance is None:
            from config import get_settings

            settings = get_settings()
            cache_service = get_cache_service()
            cls._instance = AnalyticsCache(
                cache_service,
                current_ttl=settings.cache_analytics_current_ttl_seconds,
                historical_ttl=settings.cache_analytics_historical_ttl_seconds,
                finalized_ttl=settings.cache_analytics_finalized_ttl_seconds,
                merchant_stats_ttl=settings.cache_merchant_stats_ttl_seconds,
                pacing_ttl=settings.cache_pacing_ttl_seconds,
                baselines_ttl=settings.cache_baselines_ttl_seconds,
                baselines_locked_ttl=settings.cache_baselines_locked_ttl_seconds,
                creep_ttl=settings.cache_creep_ttl_seconds,
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_analytics_cache() -> AnalyticsCache:
    return AnalyticsCacheContainer.get()
