from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Any
from uuid import UUID

from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service

if TYPE_CHECKING:
    from services.analytics.cash_flow_aggregator import CashFlowMetrics


class CashFlowMetricsRepository(BaseRepository):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "cash_flow_metrics")

    def get_by_user_and_period(
        self,
        user_id: UUID,
        period_start: date,
    ) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_start", period_start.isoformat())
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def get_periods_for_user(
        self,
        user_id: UUID,
        limit: int = 12,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .order("period_start", desc=True)
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_periods_in_range(
        self,
        user_id: UUID,
        start_date: date,
        end_date: date,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .gte("period_start", start_date.isoformat())
            .lte("period_start", end_date.isoformat())
            .order("period_start", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def upsert(self, metrics: CashFlowMetrics) -> dict[str, Any]:
        data = {
            "user_id": str(metrics.user_id),
            "period_start": metrics.period_start.isoformat(),
            "total_income": str(metrics.total_income),
            "total_expenses": str(metrics.total_expenses),
            "net_cash_flow": str(metrics.net_cash_flow),
            "savings_rate": str(metrics.savings_rate) if metrics.savings_rate is not None else None,
            "recurring_expenses": str(metrics.recurring_expenses),
            "discretionary_expenses": str(metrics.discretionary_expenses),
            "income_sources_count": metrics.income_sources_count,
            "expense_categories_count": metrics.expense_categories_count,
            "largest_expense_category": metrics.largest_expense_category,
            "largest_expense_amount": (
                str(metrics.largest_expense_amount) if metrics.largest_expense_amount else None
            ),
        }

        result = (
            self._get_table()
            .upsert(data, on_conflict="user_id,period_start")
            .execute()
        )
        if not result.data:
            raise ValueError("Failed to upsert cash flow metrics")
        return dict(result.data[0])

    def delete_for_user(self, user_id: UUID) -> int:
        result = (
            self._get_table()
            .delete()
            .eq("user_id", str(user_id))
            .execute()
        )
        return len(result.data) if result.data else 0

    def get_average_savings_rate(
        self,
        user_id: UUID,
        months: int = 6,
    ) -> float | None:
        result = (
            self._get_table()
            .select("savings_rate")
            .eq("user_id", str(user_id))
            .not_.is_("savings_rate", "null")
            .order("period_start", desc=True)
            .limit(months)
            .execute()
        )

        if not result.data:
            return None

        rates = [float(r["savings_rate"]) for r in result.data if r.get("savings_rate")]
        if not rates:
            return None

        return sum(rates) / len(rates)


class CashFlowMetricsRepositoryContainer:
    _instance: CashFlowMetricsRepository | None = None

    @classmethod
    def get(cls) -> CashFlowMetricsRepository:
        if cls._instance is None:
            cls._instance = CashFlowMetricsRepository(get_database_service())
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_cash_flow_metrics_repository() -> CashFlowMetricsRepository:
    return CashFlowMetricsRepositoryContainer.get()
