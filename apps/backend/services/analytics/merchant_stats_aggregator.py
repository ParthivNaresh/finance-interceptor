from __future__ import annotations

import statistics
import time
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID

from models.analytics import MerchantStatsCreate, MerchantStatsComputationResult
from models.enums import ComputationStatus

if TYPE_CHECKING:
    from repositories.merchant_stats import MerchantStatsRepository
    from repositories.recurring_stream import RecurringStreamRepository
    from repositories.transaction import TransactionRepository

COMPUTATION_TYPE_MERCHANT_STATS = "merchant_stats"


@dataclass
class MerchantTransactionData:
    amounts: list[Decimal]
    dates: list[date]
    datetimes: list[datetime | None]
    categories: list[str | None]


class MerchantStatsAggregator:
    UNKNOWN_MERCHANT: str = "Unknown Merchant"

    def __init__(
        self,
        transaction_repo: TransactionRepository,
        merchant_stats_repo: MerchantStatsRepository,
        recurring_stream_repo: RecurringStreamRepository,
    ) -> None:
        self._transaction_repo = transaction_repo
        self._merchant_stats_repo = merchant_stats_repo
        self._recurring_stream_repo = recurring_stream_repo

    def compute_for_user(
        self,
        user_id: UUID,
        full_recompute: bool = False,
    ) -> MerchantStatsComputationResult:
        start_time = time.monotonic()

        try:
            if full_recompute:
                self._merchant_stats_repo.delete_for_user(user_id)

            merchant_data = self._fetch_and_group_transactions(user_id)

            if not merchant_data:
                return MerchantStatsComputationResult(
                    status=ComputationStatus.SUCCESS,
                    merchants_computed=0,
                    transactions_processed=0,
                    computation_time_ms=int((time.monotonic() - start_time) * 1000),
                )

            recurring_map = self._build_recurring_stream_map(user_id)

            stats_records = self._compute_all_merchant_stats(
                user_id=user_id,
                merchant_data=merchant_data,
                recurring_map=recurring_map,
            )

            self._merchant_stats_repo.upsert_many(stats_records)

            total_transactions = sum(len(data.amounts) for data in merchant_data.values())
            duration_ms = int((time.monotonic() - start_time) * 1000)

            return MerchantStatsComputationResult(
                status=ComputationStatus.SUCCESS,
                merchants_computed=len(stats_records),
                transactions_processed=total_transactions,
                computation_time_ms=duration_ms,
            )

        except Exception as e:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            return MerchantStatsComputationResult(
                status=ComputationStatus.FAILED,
                merchants_computed=0,
                transactions_processed=0,
                computation_time_ms=duration_ms,
                error_message=str(e),
            )

    def _fetch_and_group_transactions(
        self,
        user_id: UUID,
    ) -> dict[str, MerchantTransactionData]:
        transactions, _ = self._transaction_repo.get_by_user_id(
            user_id=user_id,
            pending=False,
            limit=100000,
            offset=0,
        )

        merchant_data: dict[str, MerchantTransactionData] = defaultdict(
            lambda: MerchantTransactionData(
                amounts=[],
                dates=[],
                datetimes=[],
                categories=[],
            )
        )

        for txn in transactions:
            amount = Decimal(str(txn.get("amount", 0)))
            if amount <= 0:
                continue

            merchant_name = txn.get("merchant_name") or txn.get("name") or self.UNKNOWN_MERCHANT
            txn_date = self._parse_date(txn.get("date"))
            txn_datetime = self._parse_datetime(txn.get("datetime"))
            category = txn.get("personal_finance_category_primary")

            if txn_date is None:
                continue

            data = merchant_data[merchant_name]
            data.amounts.append(amount)
            data.dates.append(txn_date)
            data.datetimes.append(txn_datetime)
            data.categories.append(category)

        return dict(merchant_data)

    def _build_recurring_stream_map(
        self,
        user_id: UUID,
    ) -> dict[str, UUID]:
        streams = self._recurring_stream_repo.get_active_by_user_id(user_id)

        recurring_map: dict[str, UUID] = {}
        for stream in streams:
            merchant_name = stream.get("merchant_name")
            if merchant_name:
                recurring_map[merchant_name] = UUID(stream["id"])

        return recurring_map

    def _compute_all_merchant_stats(
        self,
        user_id: UUID,
        merchant_data: dict[str, MerchantTransactionData],
        recurring_map: dict[str, UUID],
    ) -> list[MerchantStatsCreate]:
        stats_records: list[MerchantStatsCreate] = []

        for merchant_name, data in merchant_data.items():
            stats = self._compute_single_merchant_stats(
                user_id=user_id,
                merchant_name=merchant_name,
                data=data,
                recurring_stream_id=recurring_map.get(merchant_name),
            )
            stats_records.append(stats)

        return stats_records

    def _compute_single_merchant_stats(
        self,
        user_id: UUID,
        merchant_name: str,
        data: MerchantTransactionData,
        recurring_stream_id: UUID | None,
    ) -> MerchantStatsCreate:
        amounts = data.amounts
        dates = data.dates
        datetimes = data.datetimes
        categories = data.categories

        total_spend = sum(amounts)
        count = len(amounts)
        avg_amount = total_spend / count if count > 0 else None
        median_amount = self._calculate_median(amounts)
        max_amount = max(amounts) if amounts else None
        min_amount = min(amounts) if amounts else None

        first_date = min(dates)
        last_date = max(dates)

        avg_days_between = self._calculate_average_days_between(dates)
        most_frequent_dow = self._calculate_most_frequent_day_of_week(dates)
        most_frequent_hour = self._calculate_most_frequent_hour(datetimes)
        primary_category = self._calculate_primary_category(categories)

        return MerchantStatsCreate(
            user_id=user_id,
            merchant_name=merchant_name,
            merchant_id=None,
            first_transaction_date=first_date,
            last_transaction_date=last_date,
            total_lifetime_spend=total_spend,
            total_transaction_count=count,
            average_transaction_amount=avg_amount,
            median_transaction_amount=median_amount,
            max_transaction_amount=max_amount,
            min_transaction_amount=min_amount,
            average_days_between_transactions=avg_days_between,
            most_frequent_day_of_week=most_frequent_dow,
            most_frequent_hour_of_day=most_frequent_hour,
            is_recurring=recurring_stream_id is not None,
            recurring_stream_id=recurring_stream_id,
            primary_category=primary_category,
        )

    @staticmethod
    def _calculate_median(amounts: list[Decimal]) -> Decimal | None:
        if not amounts:
            return None

        float_amounts = [float(a) for a in amounts]
        median_float = statistics.median(float_amounts)
        return Decimal(str(round(median_float, 4)))

    @staticmethod
    def _calculate_average_days_between(dates: list[date]) -> Decimal | None:
        if len(dates) < 2:
            return None

        sorted_dates = sorted(dates)
        deltas = [
            (sorted_dates[i + 1] - sorted_dates[i]).days
            for i in range(len(sorted_dates) - 1)
        ]

        if not deltas:
            return None

        avg_days = sum(deltas) / len(deltas)
        return Decimal(str(round(avg_days, 2)))

    @staticmethod
    def _calculate_most_frequent_day_of_week(dates: list[date]) -> int | None:
        if not dates:
            return None

        day_counts = Counter(d.weekday() for d in dates)
        most_common = day_counts.most_common(1)
        return most_common[0][0] if most_common else None

    @staticmethod
    def _calculate_most_frequent_hour(datetimes: list[datetime | None]) -> int | None:
        valid_datetimes = [dt for dt in datetimes if dt is not None]
        if not valid_datetimes:
            return None

        hour_counts = Counter(dt.hour for dt in valid_datetimes)
        most_common = hour_counts.most_common(1)
        return most_common[0][0] if most_common else None

    @staticmethod
    def _calculate_primary_category(categories: list[str | None]) -> str | None:
        valid_categories = [c for c in categories if c is not None]
        if not valid_categories:
            return None

        category_counts = Counter(valid_categories)
        most_common = category_counts.most_common(1)
        return most_common[0][0] if most_common else None

    @staticmethod
    def _parse_date(value: Any) -> date | None:
        if value is None:
            return None
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return date.fromisoformat(value[:10])
            except ValueError:
                return None
        return None

    @staticmethod
    def _parse_datetime(value: Any) -> datetime | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None


class MerchantStatsAggregatorContainer:
    _instance: MerchantStatsAggregator | None = None

    @classmethod
    def get(cls) -> MerchantStatsAggregator:
        if cls._instance is None:
            from repositories.merchant_stats import get_merchant_stats_repository
            from repositories.recurring_stream import get_recurring_stream_repository
            from repositories.transaction import get_transaction_repository

            cls._instance = MerchantStatsAggregator(
                transaction_repo=get_transaction_repository(),
                merchant_stats_repo=get_merchant_stats_repository(),
                recurring_stream_repo=get_recurring_stream_repository(),
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_merchant_stats_aggregator() -> MerchantStatsAggregator:
    return MerchantStatsAggregatorContainer.get()
