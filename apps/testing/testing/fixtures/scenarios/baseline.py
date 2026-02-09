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
from ..behavioral.spending import add_stable_spending
from ..bundles.spending import add_full_spending_bundle
from ..bundles.subscriptions import add_common_subscriptions_bundle
from .expectations import ExpectedOutcomes
from .result import ScenarioResult


def baseline_ready_user(
    email: str | None = None,
    months: int = 3,
    monthly_income: Decimal = Decimal("5000.00"),
    monthly_discretionary: Decimal = Decimal("1300.00"),
    include_subscriptions: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User with sufficient transaction history to compute lifestyle baselines.

    Creates:
        - User with checking ($8,000), savings ($15,000), and credit card accounts
        - Biweekly salary income
        - Full spending bundle (FOOD_AND_DRINK, ENTERTAINMENT, GENERAL_MERCHANDISE,
          PERSONAL_CARE, TRAVEL)
        - Common subscriptions (Netflix, Spotify, Disney+, YouTube Premium,
          Comcast, Verizon, Con Edison)

    Computes:
        - Spending analytics (periods, category spending, merchant stats)
        - Lifestyle baselines for discretionary categories
        - Creep scores (comparing current spending to baselines)

    Use for:
        - Testing baseline computation with minimum required data
        - Verifying analytics pipeline produces expected outputs
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("8000.00"),
        savings_balance=Decimal("15000.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=months,
        seed=seed,
    )

    scale_factor = float(monthly_discretionary / Decimal("1300.00"))
    add_full_spending_bundle(
        context,
        months=months,
        scale_factor=scale_factor,
        seed=seed,
    )

    if include_subscriptions:
        add_common_subscriptions_bundle(
            context,
            months=months,
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
        min_baselines=3,
        min_spending_periods=months,
        min_transactions=50,
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=baseline_result,
        creep_scores=creep_result,
        scenario_name="baseline_ready_user",
        scenario_params={
            "months": months,
            "monthly_income": str(monthly_income),
            "monthly_discretionary": str(monthly_discretionary),
            "include_subscriptions": include_subscriptions,
        },
        expected=expected,
    )


def no_creep_stable_user(
    email: str | None = None,
    months: int = 6,
    monthly_income: Decimal = Decimal("5000.00"),
    monthly_discretionary: Decimal = Decimal("1300.00"),
    variance_pct: float = 0.10,
    include_subscriptions: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User with stable spending patterns and no lifestyle creep (control scenario).

    Creates:
        - User with checking ($10,000), savings ($25,000), and credit card accounts
        - Biweekly salary income
        - Stable spending in 5 categories with configurable variance:
          FOOD_AND_DRINK ($500), ENTERTAINMENT ($150), GENERAL_MERCHANDISE ($300),
          PERSONAL_CARE ($100), TRAVEL ($250)
        - Common subscriptions (streaming + utilities)

    Computes:
        - Spending analytics
        - Lifestyle baselines
        - Creep scores (should show stability_score=100, severity=none)

    Use for:
        - Control group in creep detection tests
        - Verifying stable spending produces no false positive creep alerts
        - Testing variance tolerance in baseline calculations
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("10000.00"),
        savings_balance=Decimal("25000.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=months,
        seed=seed,
    )

    categories_config = [
        ("FOOD_AND_DRINK", Decimal("500.00")),
        ("ENTERTAINMENT", Decimal("150.00")),
        ("GENERAL_MERCHANDISE", Decimal("300.00")),
        ("PERSONAL_CARE", Decimal("100.00")),
        ("TRAVEL", Decimal("250.00")),
    ]

    scale = monthly_discretionary / Decimal("1300.00")

    for i, (category, base_amount) in enumerate(categories_config):
        scaled_amount = base_amount * scale
        add_stable_spending(
            context,
            category_primary=category,
            months=months,
            monthly_amount=scaled_amount,
            variance_pct=variance_pct,
            seed=seed + i * 100 if seed else None,
        )

    if include_subscriptions:
        add_common_subscriptions_bundle(
            context,
            months=months,
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
        stability_score_range=(90, 100),
        creep_severity="none",
        min_baselines=5,
        min_spending_periods=months,
        category_trends={
            "FOOD_AND_DRINK": "stable",
            "ENTERTAINMENT": "stable",
            "GENERAL_MERCHANDISE": "stable",
        },
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=baseline_result,
        creep_scores=creep_result,
        scenario_name="no_creep_stable_user",
        scenario_params={
            "months": months,
            "monthly_income": str(monthly_income),
            "monthly_discretionary": str(monthly_discretionary),
            "variance_pct": variance_pct,
            "include_subscriptions": include_subscriptions,
        },
        expected=expected,
    )
