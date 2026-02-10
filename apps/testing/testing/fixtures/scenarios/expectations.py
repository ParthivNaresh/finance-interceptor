from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from .result import ScenarioResult


CreepSeverity = Literal["none", "low", "medium", "high"]
TrendDirection = Literal["increasing", "stable", "decreasing"]


@dataclass(frozen=True)
class ExpectedOutcomes:
    stability_score_range: tuple[int, int] | None = None
    creep_severity: CreepSeverity | None = None
    min_baselines: int | None = None
    max_baselines: int | None = None
    min_transactions: int | None = None
    min_spending_periods: int | None = None
    min_recurring_streams: int | None = None
    category_trends: dict[str, TrendDirection] | None = None
    positive_cash_flow: bool | None = None


@dataclass
class ValidationCheck:
    name: str
    passed: bool
    expected: str
    actual: str
    message: str | None = None

    def __str__(self) -> str:
        status = "✓" if self.passed else "✗"
        base = f"{status} {self.name}: expected {self.expected}, got {self.actual}"
        if self.message:
            base += f" ({self.message})"
        return base


@dataclass
class ValidationResult:
    passed: bool
    checks: list[ValidationCheck] = field(default_factory=list)
    scenario_name: str = ""

    @property
    def failed_checks(self) -> list[ValidationCheck]:
        return [c for c in self.checks if not c.passed]

    @property
    def passed_checks(self) -> list[ValidationCheck]:
        return [c for c in self.checks if c.passed]

    def summary(self) -> str:
        status = "PASSED" if self.passed else "FAILED"
        lines = [f"Validation {status}: {self.scenario_name}"]
        lines.append(f"  {len(self.passed_checks)}/{len(self.checks)} checks passed")

        if self.failed_checks:
            lines.append("  Failed checks:")
            for check in self.failed_checks:
                lines.append(f"    {check}")

        return "\n".join(lines)

    def __str__(self) -> str:
        return self.summary()


class ScenarioValidator:
    def __init__(self, result: ScenarioResult, expected: ExpectedOutcomes) -> None:
        self._result = result
        self._expected = expected
        self._checks: list[ValidationCheck] = []

    def validate(self) -> ValidationResult:
        self._checks = []

        self._validate_stability_score()
        self._validate_creep_severity()
        self._validate_baselines()
        self._validate_transactions()
        self._validate_spending_periods()
        self._validate_recurring_streams()
        self._validate_category_trends()
        self._validate_cash_flow()

        all_passed = all(c.passed for c in self._checks)

        return ValidationResult(
            passed=all_passed,
            checks=self._checks,
            scenario_name=self._result.scenario_name,
        )

    def _validate_stability_score(self) -> None:
        if self._expected.stability_score_range is None:
            return

        low, high = self._expected.stability_score_range
        actual = self._result.stability_score

        if actual is None:
            self._checks.append(ValidationCheck(
                name="stability_score",
                passed=False,
                expected=f"[{low}, {high}]",
                actual="None",
                message="No creep scores computed",
            ))
            return

        passed = low <= actual <= high
        self._checks.append(ValidationCheck(
            name="stability_score",
            passed=passed,
            expected=f"[{low}, {high}]",
            actual=str(actual),
        ))

    def _validate_creep_severity(self) -> None:
        if self._expected.creep_severity is None:
            return

        actual = self._result.creep_severity

        if actual is None:
            self._checks.append(ValidationCheck(
                name="creep_severity",
                passed=False,
                expected=self._expected.creep_severity,
                actual="None",
                message="No creep scores computed",
            ))
            return

        passed = actual == self._expected.creep_severity
        self._checks.append(ValidationCheck(
            name="creep_severity",
            passed=passed,
            expected=self._expected.creep_severity,
            actual=actual,
        ))

    def _validate_baselines(self) -> None:
        if self._expected.min_baselines is not None:
            actual = self._result.baselines.baselines_computed if self._result.baselines else 0
            passed = actual >= self._expected.min_baselines
            self._checks.append(ValidationCheck(
                name="min_baselines",
                passed=passed,
                expected=f">= {self._expected.min_baselines}",
                actual=str(actual),
            ))

        if self._expected.max_baselines is not None:
            actual = self._result.baselines.baselines_computed if self._result.baselines else 0
            passed = actual <= self._expected.max_baselines
            self._checks.append(ValidationCheck(
                name="max_baselines",
                passed=passed,
                expected=f"<= {self._expected.max_baselines}",
                actual=str(actual),
            ))

    def _validate_transactions(self) -> None:
        if self._expected.min_transactions is None:
            return

        actual = self._result.transaction_count
        passed = actual >= self._expected.min_transactions
        self._checks.append(ValidationCheck(
            name="min_transactions",
            passed=passed,
            expected=f">= {self._expected.min_transactions}",
            actual=str(actual),
        ))

    def _validate_spending_periods(self) -> None:
        if self._expected.min_spending_periods is None:
            return

        actual = self._result.analytics.spending_periods_computed if self._result.analytics else 0
        passed = actual >= self._expected.min_spending_periods
        self._checks.append(ValidationCheck(
            name="min_spending_periods",
            passed=passed,
            expected=f">= {self._expected.min_spending_periods}",
            actual=str(actual),
        ))

    def _validate_recurring_streams(self) -> None:
        if self._expected.min_recurring_streams is None:
            return

        actual = len(self._result.context.recurring_streams)
        passed = actual >= self._expected.min_recurring_streams
        self._checks.append(ValidationCheck(
            name="min_recurring_streams",
            passed=passed,
            expected=f">= {self._expected.min_recurring_streams}",
            actual=str(actual),
        ))

    def _validate_category_trends(self) -> None:
        if self._expected.category_trends is None:
            return

        for category, expected_trend in self._expected.category_trends.items():
            trend_data = self._result.get_category_trend(category)

            if len(trend_data) < 2:
                self._checks.append(ValidationCheck(
                    name=f"trend_{category}",
                    passed=False,
                    expected=expected_trend,
                    actual="insufficient_data",
                    message=f"Need at least 2 periods, got {len(trend_data)}",
                ))
                continue

            actual_trend = self._compute_trend_direction(trend_data)
            passed = actual_trend == expected_trend
            self._checks.append(ValidationCheck(
                name=f"trend_{category}",
                passed=passed,
                expected=expected_trend,
                actual=actual_trend,
            ))

    def _validate_cash_flow(self) -> None:
        if self._expected.positive_cash_flow is None:
            return

        periods = self._result.get_spending_periods()
        if not periods:
            self._checks.append(ValidationCheck(
                name="positive_cash_flow",
                passed=False,
                expected=str(self._expected.positive_cash_flow),
                actual="no_data",
                message="No spending periods found",
            ))
            return

        total_net_flow = sum(p.net_flow for p in periods)
        actual_positive = total_net_flow > Decimal("0")
        passed = actual_positive == self._expected.positive_cash_flow

        self._checks.append(ValidationCheck(
            name="positive_cash_flow",
            passed=passed,
            expected=str(self._expected.positive_cash_flow),
            actual=str(actual_positive),
            message=f"net_flow={total_net_flow}",
        ))

    def _compute_trend_direction(
        self,
        trend_data: list[tuple[object, Decimal]],
    ) -> TrendDirection:
        if len(trend_data) < 2:
            return "stable"

        sorted_data = sorted(trend_data, key=lambda x: x[0])
        first_half = sorted_data[: len(sorted_data) // 2]
        second_half = sorted_data[len(sorted_data) // 2 :]

        first_avg = sum(d[1] for d in first_half) / len(first_half)
        second_avg = sum(d[1] for d in second_half) / len(second_half)

        if first_avg == Decimal("0"):
            return "stable" if second_avg == Decimal("0") else "increasing"

        change_pct = (second_avg - first_avg) / first_avg

        if change_pct > Decimal("0.10"):
            return "increasing"
        elif change_pct < Decimal("-0.10"):
            return "decreasing"
        else:
            return "stable"
