from __future__ import annotations

from uuid import UUID

from observability import get_logger
from services.cache.account_cache import AccountCache
from services.cache.analytics_cache import AnalyticsCache
from services.cache.recurring_cache import RecurringCache

logger = get_logger("services.cache.invalidation")


class CacheInvalidator:
    def __init__(
        self,
        analytics_cache: AnalyticsCache,
        account_cache: AccountCache,
        recurring_cache: RecurringCache,
    ) -> None:
        self._analytics = analytics_cache
        self._accounts = account_cache
        self._recurring = recurring_cache

    def on_transaction_sync(self, user_id: UUID) -> None:
        log = logger.bind(user_id=str(user_id), event="transaction_sync")
        count = 0
        count += self._analytics.invalidate_spending_for_user(user_id)
        count += self._analytics.invalidate_merchant_stats_for_user(user_id)
        count += self._analytics.invalidate_cashflow_for_user(user_id)
        count += self._analytics.invalidate_creep_for_user(user_id)
        count += self._accounts.invalidate_for_user(user_id)
        log.debug("cache.invalidation.transaction_sync", keys_deleted=count)

    def on_analytics_computation(self, user_id: UUID) -> None:
        log = logger.bind(user_id=str(user_id), event="analytics_computation")
        count = self._analytics.invalidate_all_for_user(user_id)
        log.debug("cache.invalidation.analytics_computation", keys_deleted=count)

    def on_recurring_sync(self, user_id: UUID) -> None:
        log = logger.bind(user_id=str(user_id), event="recurring_sync")
        count = self._recurring.invalidate_for_user(user_id)
        log.debug("cache.invalidation.recurring_sync", keys_deleted=count)

    def on_baseline_change(self, user_id: UUID) -> None:
        log = logger.bind(user_id=str(user_id), event="baseline_change")
        count = self._analytics.invalidate_creep_for_user(user_id)
        log.debug("cache.invalidation.baseline_change", keys_deleted=count)

    def on_creep_computation(self, user_id: UUID) -> None:
        log = logger.bind(user_id=str(user_id), event="creep_computation")
        count = self._analytics.invalidate_creep_for_user(user_id)
        log.debug("cache.invalidation.creep_computation", keys_deleted=count)

    def on_plaid_item_deleted(self, user_id: UUID) -> None:
        log = logger.bind(user_id=str(user_id), event="plaid_item_deleted")
        count = 0
        count += self._analytics.invalidate_all_for_user(user_id)
        count += self._accounts.invalidate_for_user(user_id)
        count += self._recurring.invalidate_for_user(user_id)
        log.debug("cache.invalidation.plaid_item_deleted", keys_deleted=count)


class CacheInvalidatorContainer:
    _instance: CacheInvalidator | None = None

    @classmethod
    def get(cls) -> CacheInvalidator:
        if cls._instance is None:
            from services.cache.account_cache import get_account_cache
            from services.cache.analytics_cache import get_analytics_cache
            from services.cache.recurring_cache import get_recurring_cache

            cls._instance = CacheInvalidator(
                analytics_cache=get_analytics_cache(),
                account_cache=get_account_cache(),
                recurring_cache=get_recurring_cache(),
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_cache_invalidator() -> CacheInvalidator:
    return CacheInvalidatorContainer.get()
