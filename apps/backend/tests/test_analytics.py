from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from testing.fixtures.scenarios.result import ScenarioResult


class TestBaselineComputation:
    def test_baselines_are_computed_with_sufficient_data(
        self, baseline_user: ScenarioResult
    ) -> None:
        assert baseline_user.has_baselines
        assert baseline_user.baselines is not None
        assert baseline_user.baselines.baselines_computed >= 5

    def test_baseline_categories_are_discretionary(
        self, baseline_user: ScenarioResult
    ) -> None:
        baselines = baseline_user.get_baselines()
        discretionary_categories = {
            "FOOD_AND_DRINK",
            "ENTERTAINMENT",
            "GENERAL_MERCHANDISE",
            "PERSONAL_CARE",
            "TRAVEL",
            "GENERAL_SERVICES",
        }

        for baseline in baselines:
            assert baseline.category_primary in discretionary_categories

    def test_baseline_amounts_are_positive(self, baseline_user: ScenarioResult) -> None:
        baselines = baseline_user.get_baselines()

        for baseline in baselines:
            assert baseline.baseline_monthly_amount > Decimal("0")


class TestStableSpending:
    def test_stable_user_has_high_stability_score(
        self, stable_user: ScenarioResult
    ) -> None:
        assert stable_user.stability_score == 100

    def test_stable_user_has_no_creep_severity(
        self, stable_user: ScenarioResult
    ) -> None:
        assert stable_user.creep_severity == "none"

    def test_stable_user_spending_is_consistent(
        self, stable_user: ScenarioResult
    ) -> None:
        trend = stable_user.get_category_trend("FOOD_AND_DRINK")
        assert len(trend) >= 3

        amounts = [amount for _, amount in trend]
        avg = sum(amounts) / len(amounts)
        max_deviation = max(abs(a - avg) for a in amounts)
        deviation_pct = (max_deviation / avg) * 100 if avg > 0 else 0

        assert deviation_pct < 20


class TestLifestyleCreepDetection:
    def test_creep_user_has_baselines(self, creep_user: ScenarioResult) -> None:
        assert creep_user.has_baselines

    def test_creep_is_visible_in_spending_trend(
        self, creep_user: ScenarioResult
    ) -> None:
        trend = creep_user.get_category_trend("FOOD_AND_DRINK")
        assert len(trend) >= 6

        baseline_avg = sum(t[1] for t in trend[:3]) / 3
        recent_avg = sum(t[1] for t in trend[3:6]) / 3

        assert recent_avg > baseline_avg

    def test_creep_percentage_matches_expected(
        self, creep_user: ScenarioResult
    ) -> None:
        trend = creep_user.get_category_trend("FOOD_AND_DRINK")

        baseline_avg = sum(t[1] for t in trend[:3]) / 3
        recent_avg = sum(t[1] for t in trend[3:6]) / 3

        actual_increase_pct = ((recent_avg - baseline_avg) / baseline_avg) * 100

        assert actual_increase_pct > 10
        assert actual_increase_pct < 40
