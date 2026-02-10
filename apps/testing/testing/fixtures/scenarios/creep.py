from __future__ import annotations

from datetime import date
from decimal import Decimal

from ...context import TestContext
from ..behavioral.account_setup import create_user_with_full_bank
from ..behavioral.analytics import (
    compute_analytics,
    compute_baselines,
    compute_creep_scores,
)
from ..behavioral.income import add_salary_income
from ..behavioral.spending import add_gradual_increase, add_stable_spending
from ..bundles.subscriptions import add_common_subscriptions_bundle
from .expectations import ExpectedOutcomes
from .result import ScenarioResult


def lifestyle_creep_gradual(
    email: str | None = None,
    baseline_months: int = 3,
    creep_months: int = 3,
    monthly_income: Decimal = Decimal("5000.00"),
    baseline_discretionary: Decimal = Decimal("1200.00"),
    creep_percentage: float = 0.25,
    creep_categories: list[str] | None = None,
    include_subscriptions: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User exhibiting gradual lifestyle creep in specific categories.

    Creates:
        - User with checking ($8,000), savings ($20,000), and credit card accounts
        - Biweekly salary income
        - Stable spending in non-creeping categories:
          GENERAL_MERCHANDISE ($300), PERSONAL_CARE ($100), TRAVEL ($200)
        - Gradually increasing spending in creeping categories (default):
          FOOD_AND_DRINK ($400 -> +25%), ENTERTAINMENT ($200 -> +25%)
        - Common subscriptions (streaming + utilities)

    Computes:
        - Spending analytics
        - Lifestyle baselines (computed from baseline_months)
        - Creep scores (should detect increase in creep_categories)

    Use for:
        - Testing gradual creep detection algorithms
        - Verifying category-specific creep identification
        - Testing creep severity thresholds
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    total_months = baseline_months + creep_months

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("8000.00"),
        savings_balance=Decimal("20000.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=total_months,
        seed=seed,
    )

    target_creep_categories = creep_categories or ["FOOD_AND_DRINK", "ENTERTAINMENT"]

    stable_categories = [
        ("GENERAL_MERCHANDISE", Decimal("300.00")),
        ("PERSONAL_CARE", Decimal("100.00")),
        ("TRAVEL", Decimal("200.00")),
    ]

    creeping_categories = [
        ("FOOD_AND_DRINK", Decimal("400.00")),
        ("ENTERTAINMENT", Decimal("200.00")),
    ]

    scale = baseline_discretionary / Decimal("1200.00")

    for i, (category, base_amount) in enumerate(stable_categories):
        scaled_amount = base_amount * scale
        add_stable_spending(
            context,
            category_primary=category,
            months=total_months,
            monthly_amount=scaled_amount,
            start_months_ago=total_months,
            seed=seed + i * 100 if seed else None,
        )

    for i, (category, base_amount) in enumerate(creeping_categories):
        scaled_amount = base_amount * scale

        if category in target_creep_categories:
            add_stable_spending(
                context,
                category_primary=category,
                months=baseline_months,
                monthly_amount=scaled_amount,
                start_months_ago=total_months,
                seed=seed + (i + 10) * 100 if seed else None,
            )

            end_amount = scaled_amount * Decimal(str(1 + creep_percentage))
            add_gradual_increase(
                context,
                category_primary=category,
                months=creep_months,
                start_monthly_amount=scaled_amount,
                end_monthly_amount=end_amount,
                seed=seed + (i + 20) * 100 if seed else None,
            )
        else:
            add_stable_spending(
                context,
                category_primary=category,
                months=total_months,
                monthly_amount=scaled_amount,
                start_months_ago=total_months,
                seed=seed + (i + 10) * 100 if seed else None,
            )

    if include_subscriptions:
        add_common_subscriptions_bundle(
            context,
            months=total_months,
            include_streaming=True,
            include_utilities=True,
            seed=seed,
        )

    analytics_result = compute_analytics(context)
    baseline_result = compute_baselines(context)

    creep_result = None
    if baseline_result.success:
        creep_result = compute_creep_scores(context)

    expected = ExpectedOutcomes(
        stability_score_range=(60, 85),
        creep_severity="medium",
        min_baselines=5,
        min_spending_periods=total_months,
        category_trends={
            "FOOD_AND_DRINK": "increasing",
            "ENTERTAINMENT": "increasing",
            "GENERAL_MERCHANDISE": "stable",
        },
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=baseline_result,
        creep_scores=creep_result,
        scenario_name="lifestyle_creep_gradual",
        scenario_params={
            "baseline_months": baseline_months,
            "creep_months": creep_months,
            "monthly_income": str(monthly_income),
            "baseline_discretionary": str(baseline_discretionary),
            "creep_percentage": creep_percentage,
            "creep_categories": target_creep_categories,
        },
        expected=expected,
    )


def lifestyle_creep_severe(
    email: str | None = None,
    baseline_months: int = 3,
    creep_months: int = 3,
    monthly_income: Decimal = Decimal("5000.00"),
    baseline_discretionary: Decimal = Decimal("1200.00"),
    creep_percentage: float = 0.50,
    include_subscriptions: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User exhibiting severe lifestyle creep across ALL discretionary categories.

    Creates:
        - User with checking ($8,000), savings ($20,000), and credit card accounts
        - Biweekly salary income
        - Gradually increasing spending in ALL categories (default +50%):
          FOOD_AND_DRINK, ENTERTAINMENT, GENERAL_MERCHANDISE, PERSONAL_CARE, TRAVEL
        - Common subscriptions (streaming + utilities)

    Computes:
        - Spending analytics
        - Lifestyle baselines
        - Creep scores (should show high severity across all categories)

    Use for:
        - Testing severe/high creep severity detection
        - Verifying aggregate creep scoring when all categories increase
        - Testing alert thresholds for significant lifestyle changes
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    total_months = baseline_months + creep_months

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("8000.00"),
        savings_balance=Decimal("20000.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=total_months,
        seed=seed,
    )

    all_categories = [
        ("FOOD_AND_DRINK", Decimal("400.00")),
        ("ENTERTAINMENT", Decimal("200.00")),
        ("GENERAL_MERCHANDISE", Decimal("300.00")),
        ("PERSONAL_CARE", Decimal("100.00")),
        ("TRAVEL", Decimal("200.00")),
    ]

    scale = baseline_discretionary / Decimal("1200.00")

    for i, (category, base_amount) in enumerate(all_categories):
        scaled_amount = base_amount * scale

        add_stable_spending(
            context,
            category_primary=category,
            months=baseline_months,
            monthly_amount=scaled_amount,
            start_months_ago=total_months,
            seed=seed + i * 100 if seed else None,
        )

        end_amount = scaled_amount * Decimal(str(1 + creep_percentage))
        add_gradual_increase(
            context,
            category_primary=category,
            months=creep_months,
            start_monthly_amount=scaled_amount,
            end_monthly_amount=end_amount,
            seed=seed + (i + 10) * 100 if seed else None,
        )

    if include_subscriptions:
        add_common_subscriptions_bundle(
            context,
            months=total_months,
            include_streaming=True,
            include_utilities=True,
            seed=seed,
        )

    analytics_result = compute_analytics(context)
    baseline_result = compute_baselines(context)

    creep_result = None
    if baseline_result.success:
        creep_result = compute_creep_scores(context)

    expected = ExpectedOutcomes(
        stability_score_range=(30, 60),
        creep_severity="high",
        min_baselines=5,
        min_spending_periods=total_months,
        category_trends={
            "FOOD_AND_DRINK": "increasing",
            "ENTERTAINMENT": "increasing",
            "GENERAL_MERCHANDISE": "increasing",
            "PERSONAL_CARE": "increasing",
            "TRAVEL": "increasing",
        },
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=baseline_result,
        creep_scores=creep_result,
        scenario_name="lifestyle_creep_severe",
        scenario_params={
            "baseline_months": baseline_months,
            "creep_months": creep_months,
            "monthly_income": str(monthly_income),
            "baseline_discretionary": str(baseline_discretionary),
            "creep_percentage": creep_percentage,
        },
        expected=expected,
    )


def lifestyle_creep_seasonal(
    email: str | None = None,
    baseline_months: int = 3,
    monthly_income: Decimal = Decimal("5000.00"),
    baseline_discretionary: Decimal = Decimal("1200.00"),
    seasonal_spike_percentage: float = 0.80,
    seasonal_month: int = 12,
    include_subscriptions: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User with seasonal spending spike (e.g., holiday shopping in December).

    Creates:
        - User with checking ($8,000), savings ($20,000), and credit card accounts
        - Biweekly salary income
        - Stable spending in non-seasonal categories:
          FOOD_AND_DRINK ($400), ENTERTAINMENT ($200), PERSONAL_CARE ($100)
        - Seasonal spike in specific categories (default +80% in December):
          TRAVEL ($200 -> $360), GENERAL_MERCHANDISE ($300 -> $540)
        - Common subscriptions (streaming + utilities)

    Computes:
        - Spending analytics
        - Lifestyle baselines
        - Creep scores (should distinguish seasonal spike from true creep)

    Use for:
        - Testing seasonality detection vs lifestyle creep
        - Verifying the system doesn't flag holiday spending as creep
        - Testing month-specific spending pattern analysis
    """
    context = TestContext()

    ref_date = reference_date or date.today()
    seasonal_ref_date = date(ref_date.year, seasonal_month, 28)

    context.with_reference_date(seasonal_ref_date)
    if seed:
        context.with_seed(seed)

    total_months = baseline_months + 1

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("8000.00"),
        savings_balance=Decimal("20000.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=total_months,
        seed=seed,
    )

    seasonal_categories = ["TRAVEL", "GENERAL_MERCHANDISE"]

    stable_categories = [
        ("FOOD_AND_DRINK", Decimal("400.00")),
        ("ENTERTAINMENT", Decimal("200.00")),
        ("PERSONAL_CARE", Decimal("100.00")),
    ]

    spike_categories = [
        ("TRAVEL", Decimal("200.00")),
        ("GENERAL_MERCHANDISE", Decimal("300.00")),
    ]

    scale = baseline_discretionary / Decimal("1200.00")

    for i, (category, base_amount) in enumerate(stable_categories):
        scaled_amount = base_amount * scale
        add_stable_spending(
            context,
            category_primary=category,
            months=total_months,
            monthly_amount=scaled_amount,
            seed=seed + i * 100 if seed else None,
        )

    for i, (category, base_amount) in enumerate(spike_categories):
        scaled_amount = base_amount * scale

        add_stable_spending(
            context,
            category_primary=category,
            months=baseline_months,
            monthly_amount=scaled_amount,
            seed=seed + (i + 10) * 100 if seed else None,
        )

        spike_amount = scaled_amount * Decimal(str(1 + seasonal_spike_percentage))
        add_stable_spending(
            context,
            category_primary=category,
            months=1,
            monthly_amount=spike_amount,
            seed=seed + (i + 20) * 100 if seed else None,
        )

    if include_subscriptions:
        add_common_subscriptions_bundle(
            context,
            months=total_months,
            include_streaming=True,
            include_utilities=True,
            seed=seed,
        )

    analytics_result = compute_analytics(context)
    baseline_result = compute_baselines(context)

    creep_result = None
    if baseline_result.success:
        creep_result = compute_creep_scores(context)

    expected = ExpectedOutcomes(
        min_baselines=5,
        min_spending_periods=total_months,
        category_trends={
            "FOOD_AND_DRINK": "stable",
            "ENTERTAINMENT": "stable",
        },
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=baseline_result,
        creep_scores=creep_result,
        scenario_name="lifestyle_creep_seasonal",
        scenario_params={
            "baseline_months": baseline_months,
            "monthly_income": str(monthly_income),
            "baseline_discretionary": str(baseline_discretionary),
            "seasonal_spike_percentage": seasonal_spike_percentage,
            "seasonal_month": seasonal_month,
            "seasonal_categories": seasonal_categories,
        },
        expected=expected,
    )
