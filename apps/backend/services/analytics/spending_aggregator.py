from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any
from uuid import UUID

from models.analytics import CategorySpendingCreate, MerchantSpendingCreate, SpendingPeriodCreate
from models.enums import PeriodType
from services.analytics.period_calculator import get_period_bounds
from services.analytics.transfer_detector import TransferDetector


@dataclass
class AggregationResult:
    spending_period: SpendingPeriodCreate
    category_spending: list[CategorySpendingCreate] = field(default_factory=list)
    merchant_spending: list[MerchantSpendingCreate] = field(default_factory=list)
    transactions_processed: int = 0


class SpendingAggregator:
    UNKNOWN_CATEGORY: str = "UNCATEGORIZED"
    UNKNOWN_MERCHANT: str = "Unknown Merchant"

    def __init__(self, transfer_detector: TransferDetector) -> None:
        self._transfer_detector = transfer_detector

    def aggregate_period(
        self,
        user_id: UUID,
        transactions: list[dict[str, Any]],
        period_type: PeriodType,
        period_start: date,
    ) -> AggregationResult:
        _, period_end = get_period_bounds(period_start, period_type)

        totals = self._compute_totals(transactions)
        category_breakdown = self._compute_category_breakdown(
            user_id, transactions, period_type, period_start
        )
        merchant_breakdown = self._compute_merchant_breakdown(
            user_id, transactions, period_type, period_start
        )

        spending_period = SpendingPeriodCreate(
            user_id=user_id,
            period_type=period_type,
            period_start=period_start,
            period_end=period_end,
            total_inflow=totals.total_inflow,
            total_outflow=totals.total_outflow,
            net_flow=totals.net_flow,
            total_inflow_excluding_transfers=totals.total_inflow_excluding_transfers,
            total_outflow_excluding_transfers=totals.total_outflow_excluding_transfers,
            net_flow_excluding_transfers=totals.net_flow_excluding_transfers,
            transaction_count=len(transactions),
            is_finalized=False,
        )

        return AggregationResult(
            spending_period=spending_period,
            category_spending=category_breakdown,
            merchant_spending=merchant_breakdown,
            transactions_processed=len(transactions),
        )

    def _compute_totals(
        self,
        transactions: list[dict[str, Any]],
    ) -> _SpendingTotals:
        total_inflow = Decimal("0")
        total_outflow = Decimal("0")
        total_inflow_excluding_transfers = Decimal("0")
        total_outflow_excluding_transfers = Decimal("0")

        for txn in transactions:
            amount = Decimal(str(txn.get("amount", 0)))
            is_transfer = self._transfer_detector.is_internal_transfer(txn)

            if amount < 0:
                total_inflow += abs(amount)
                if not is_transfer:
                    total_inflow_excluding_transfers += abs(amount)
            else:
                total_outflow += amount
                if not is_transfer:
                    total_outflow_excluding_transfers += amount

        return _SpendingTotals(
            total_inflow=total_inflow,
            total_outflow=total_outflow,
            net_flow=total_inflow - total_outflow,
            total_inflow_excluding_transfers=total_inflow_excluding_transfers,
            total_outflow_excluding_transfers=total_outflow_excluding_transfers,
            net_flow_excluding_transfers=total_inflow_excluding_transfers
            - total_outflow_excluding_transfers,
        )

    def _compute_category_breakdown(
        self,
        user_id: UUID,
        transactions: list[dict[str, Any]],
        period_type: PeriodType,
        period_start: date,
    ) -> list[CategorySpendingCreate]:
        category_data: dict[str, _CategoryAccumulator] = defaultdict(_CategoryAccumulator)

        for txn in transactions:
            amount = Decimal(str(txn.get("amount", 0)))
            if amount <= 0:
                continue

            category_primary = txn.get("personal_finance_category_primary") or self.UNKNOWN_CATEGORY
            category_detailed = txn.get("personal_finance_category_detailed")

            acc = category_data[category_primary]
            acc.total_amount += amount
            acc.transaction_count += 1
            acc.category_detailed = category_detailed
            acc.largest_transaction = max(acc.largest_transaction, amount)

        result: list[CategorySpendingCreate] = []
        for category_primary, acc in category_data.items():
            avg = acc.total_amount / acc.transaction_count if acc.transaction_count > 0 else None

            result.append(
                CategorySpendingCreate(
                    user_id=user_id,
                    period_type=period_type,
                    period_start=period_start,
                    category_primary=category_primary,
                    category_detailed=acc.category_detailed,
                    total_amount=acc.total_amount,
                    transaction_count=acc.transaction_count,
                    average_transaction=avg,
                    largest_transaction=acc.largest_transaction
                    if acc.largest_transaction > 0
                    else None,
                )
            )

        return result

    def _compute_merchant_breakdown(
        self,
        user_id: UUID,
        transactions: list[dict[str, Any]],
        period_type: PeriodType,
        period_start: date,
    ) -> list[MerchantSpendingCreate]:
        merchant_data: dict[str, _MerchantAccumulator] = defaultdict(_MerchantAccumulator)

        for txn in transactions:
            amount = Decimal(str(txn.get("amount", 0)))
            if amount <= 0:
                continue

            merchant_name = txn.get("merchant_name") or txn.get("name") or self.UNKNOWN_MERCHANT

            acc = merchant_data[merchant_name]
            acc.total_amount += amount
            acc.transaction_count += 1

        result: list[MerchantSpendingCreate] = []
        for merchant_name, acc in merchant_data.items():
            avg = acc.total_amount / acc.transaction_count if acc.transaction_count > 0 else None

            result.append(
                MerchantSpendingCreate(
                    user_id=user_id,
                    period_type=period_type,
                    period_start=period_start,
                    merchant_name=merchant_name,
                    merchant_id=None,
                    total_amount=acc.total_amount,
                    transaction_count=acc.transaction_count,
                    average_transaction=avg,
                )
            )

        return result


@dataclass
class _SpendingTotals:
    total_inflow: Decimal
    total_outflow: Decimal
    net_flow: Decimal
    total_inflow_excluding_transfers: Decimal
    total_outflow_excluding_transfers: Decimal
    net_flow_excluding_transfers: Decimal


class _CategoryAccumulator:
    __slots__ = ("category_detailed", "largest_transaction", "total_amount", "transaction_count")

    def __init__(self) -> None:
        self.total_amount: Decimal = Decimal("0")
        self.transaction_count: int = 0
        self.category_detailed: str | None = None
        self.largest_transaction: Decimal = Decimal("0")


class _MerchantAccumulator:
    __slots__ = ("total_amount", "transaction_count")

    def __init__(self) -> None:
        self.total_amount: Decimal = Decimal("0")
        self.transaction_count: int = 0


class SpendingAggregatorContainer:
    _instance: SpendingAggregator | None = None

    @classmethod
    def get(cls) -> SpendingAggregator:
        if cls._instance is None:
            from services.analytics.transfer_detector import get_transfer_detector

            cls._instance = SpendingAggregator(
                transfer_detector=get_transfer_detector(),
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_spending_aggregator() -> SpendingAggregator:
    return SpendingAggregatorContainer.get()
