from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from ...client import get_test_client
from ...context import TestContext
from ..behavioral.analytics import (
    AnalyticsComputationResult,
    BaselineComputationResult,
    CreepScoreComputationResult,
)

if TYPE_CHECKING:
    from .expectations import ExpectedOutcomes, ValidationResult


@dataclass
class SpendingPeriodRecord:
    period_start: date
    period_end: date
    total_inflow: Decimal
    total_outflow: Decimal
    net_flow: Decimal
    transaction_count: int


@dataclass
class CategorySpendingRecord:
    period_start: date
    category_primary: str
    total_amount: Decimal
    transaction_count: int


@dataclass
class BaselineRecord:
    category_primary: str
    baseline_monthly_amount: Decimal
    baseline_period_start: date
    baseline_period_end: date
    is_locked: bool


@dataclass
class CreepScoreRecord:
    period_start: date
    category_primary: str
    baseline_amount: Decimal
    current_amount: Decimal
    absolute_change: Decimal
    percentage_change: Decimal
    creep_score: Decimal


@dataclass
class ScenarioResult:
    context: TestContext
    analytics: AnalyticsComputationResult | None = None
    baselines: BaselineComputationResult | None = None
    creep_scores: CreepScoreComputationResult | None = None
    
    scenario_name: str = ""
    scenario_params: dict[str, Any] = field(default_factory=dict)
    expected: ExpectedOutcomes | None = None

    @property
    def user_id(self) -> str:
        if self.context.user is None:
            raise ValueError("No user in context")
        return str(self.context.user.id)

    @property
    def transaction_count(self) -> int:
        return self.context.transaction_count()

    @property
    def total_spending(self) -> Decimal:
        return self.context.total_transaction_amount()

    @property
    def has_baselines(self) -> bool:
        return self.baselines is not None and self.baselines.baselines_computed > 0

    @property
    def has_creep_scores(self) -> bool:
        return self.creep_scores is not None and self.creep_scores.scores_computed > 0

    @property
    def stability_score(self) -> int | None:
        if self.creep_scores is None:
            return None
        return self.creep_scores.stability_score

    @property
    def creep_severity(self) -> str | None:
        if self.creep_scores is None:
            return None
        return self.creep_scores.overall_severity

    def get_spending_periods(self) -> list[SpendingPeriodRecord]:
        client = get_test_client()
        records = client.select("spending_periods", filters={"user_id": self.user_id})
        return [
            SpendingPeriodRecord(
                period_start=date.fromisoformat(r["period_start"]),
                period_end=date.fromisoformat(r["period_end"]),
                total_inflow=Decimal(str(r["total_inflow"])),
                total_outflow=Decimal(str(r["total_outflow"])),
                net_flow=Decimal(str(r["net_flow"])),
                transaction_count=int(r["transaction_count"]),
            )
            for r in sorted(records, key=lambda x: x["period_start"])
        ]

    def get_category_spending(self, period_start: date | None = None) -> list[CategorySpendingRecord]:
        client = get_test_client()
        filters: dict[str, Any] = {"user_id": self.user_id}
        if period_start:
            filters["period_start"] = period_start.isoformat()
        
        records = client.select("category_spending", filters=filters)
        return [
            CategorySpendingRecord(
                period_start=date.fromisoformat(r["period_start"]),
                category_primary=r["category_primary"],
                total_amount=Decimal(str(r["total_amount"])),
                transaction_count=int(r["transaction_count"]),
            )
            for r in sorted(records, key=lambda x: (x["period_start"], x["category_primary"]))
        ]

    def get_category_spending_by_period(self) -> dict[date, list[CategorySpendingRecord]]:
        records = self.get_category_spending()
        by_period: dict[date, list[CategorySpendingRecord]] = {}
        for r in records:
            if r.period_start not in by_period:
                by_period[r.period_start] = []
            by_period[r.period_start].append(r)
        return by_period

    def get_baselines(self) -> list[BaselineRecord]:
        client = get_test_client()
        records = client.select("lifestyle_baselines", filters={"user_id": self.user_id})
        return [
            BaselineRecord(
                category_primary=r["category_primary"],
                baseline_monthly_amount=Decimal(str(r["baseline_monthly_amount"])),
                baseline_period_start=date.fromisoformat(r["baseline_period_start"]),
                baseline_period_end=date.fromisoformat(r["baseline_period_end"]),
                is_locked=bool(r["is_locked"]),
            )
            for r in sorted(records, key=lambda x: x["category_primary"])
        ]

    def get_creep_scores(self, period_start: date | None = None) -> list[CreepScoreRecord]:
        client = get_test_client()
        filters: dict[str, Any] = {"user_id": self.user_id}
        if period_start:
            filters["period_start"] = period_start.isoformat()
        
        records = client.select("lifestyle_creep_scores", filters=filters)
        return [
            CreepScoreRecord(
                period_start=date.fromisoformat(r["period_start"]),
                category_primary=r["category_primary"],
                baseline_amount=Decimal(str(r["baseline_amount"])),
                current_amount=Decimal(str(r["current_amount"])),
                absolute_change=Decimal(str(r["absolute_change"])),
                percentage_change=Decimal(str(r["percentage_change"])),
                creep_score=Decimal(str(r["creep_score"])),
            )
            for r in sorted(records, key=lambda x: (x["period_start"], x["category_primary"]))
        ]

    def get_creep_scores_by_period(self) -> dict[date, list[CreepScoreRecord]]:
        records = self.get_creep_scores()
        by_period: dict[date, list[CreepScoreRecord]] = {}
        for r in records:
            if r.period_start not in by_period:
                by_period[r.period_start] = []
            by_period[r.period_start].append(r)
        return by_period

    def get_category_trend(self, category: str) -> list[tuple[date, Decimal]]:
        spending = self.get_category_spending()
        return [
            (r.period_start, r.total_amount)
            for r in spending
            if r.category_primary == category
        ]

    def summary(self) -> str:
        lines = [
            f"Scenario: {self.scenario_name}",
            f"User ID: {self.user_id}",
            f"Transactions: {self.transaction_count}",
            f"Accounts: {len(self.context.accounts)}",
        ]

        if self.analytics:
            lines.append(f"Analytics: {self.analytics.spending_periods_computed} periods, {self.analytics.transactions_processed} txns")

        if self.baselines:
            if self.baselines.success:
                lines.append(f"Baselines: {self.baselines.baselines_computed} categories")
            else:
                lines.append(f"Baselines: {self.baselines.error}")

        if self.creep_scores:
            if self.creep_scores.success:
                lines.append(f"Creep: severity={self.creep_severity}, stability={self.stability_score}")
            else:
                lines.append(f"Creep: {self.creep_scores.error}")

        return "\n".join(lines)

    def validate(self) -> ValidationResult:
        from .expectations import ScenarioValidator, ValidationResult

        if self.expected is None:
            return ValidationResult(
                passed=True,
                checks=[],
                scenario_name=self.scenario_name,
            )

        validator = ScenarioValidator(self, self.expected)
        return validator.validate()

    def assert_valid(self) -> None:
        result = self.validate()
        if not result.passed:
            raise AssertionError(result.summary())

    def __repr__(self) -> str:
        return f"ScenarioResult(scenario={self.scenario_name}, txns={self.transaction_count}, baselines={self.has_baselines}, creep={self.has_creep_scores})"
