from __future__ import annotations

from datetime import date
from decimal import Decimal

from ...context import TestContext
from ..behavioral.account_setup import create_user_with_full_bank
from ..behavioral.analytics import compute_analytics
from ..behavioral.income import add_salary_income
from ..behavioral.spending import add_stable_spending
from ..behavioral.subscriptions import (
    add_cancelled_subscription,
    add_subscription,
    add_subscription_with_price_change,
)
from ..bundles.subscriptions import (
    NEWS_SUBSCRIPTIONS,
    PREMIUM_STREAMING_SUBSCRIPTIONS,
    add_common_subscriptions_bundle,
)
from .result import ScenarioResult


def subscription_heavy_user(
    email: str | None = None,
    months: int = 6,
    monthly_income: Decimal = Decimal("5000.00"),
    include_premium_streaming: bool = True,
    include_fitness: bool = True,
    include_productivity: bool = True,
    include_news: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User with many subscriptions (18 total, ~10.5% of income).

    Creates:
        - User with checking ($6,000), savings ($12,000), and credit card accounts
        - Biweekly salary income ($5,000/month)
        - Common subscriptions: Netflix, Spotify, Disney+, YouTube Premium,
          Comcast, Verizon, Con Edison
        - Premium streaming: HBO Max, Hulu, Paramount+, Apple TV+, Peacock
        - Fitness: Planet Fitness
        - Productivity: iCloud Storage, Dropbox
        - News: New York Times, Wall Street Journal, The Athletic
        - Stable spending in FOOD_AND_DRINK ($400), GENERAL_MERCHANDISE ($200)

    Computes:
        - Spending analytics (periods, category spending)

    Use for:
        - Testing subscription detection with many recurring charges
        - Verifying subscription-to-income ratio calculations
        - Testing subscription management recommendations
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("6000.00"),
        savings_balance=Decimal("12000.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=months,
        seed=seed,
    )

    add_common_subscriptions_bundle(
        context,
        months=months,
        include_streaming=True,
        include_utilities=True,
        include_fitness=include_fitness,
        include_productivity=include_productivity,
        seed=seed,
    )

    offset = 100
    if include_premium_streaming:
        for i, spec in enumerate(PREMIUM_STREAMING_SUBSCRIPTIONS):
            add_subscription(
                context,
                merchant_name=spec.merchant_name,
                amount=spec.amount,
                months=months,
                category_primary=spec.category_primary,
                category_detailed=spec.category_detailed,
                seed=seed + offset + i if seed else None,
            )
        offset += len(PREMIUM_STREAMING_SUBSCRIPTIONS)

    if include_news:
        for i, spec in enumerate(NEWS_SUBSCRIPTIONS):
            add_subscription(
                context,
                merchant_name=spec.merchant_name,
                amount=spec.amount,
                months=months,
                category_primary=spec.category_primary,
                category_detailed=spec.category_detailed,
                seed=seed + offset + i if seed else None,
            )

    categories = [
        ("FOOD_AND_DRINK", Decimal("400.00")),
        ("GENERAL_MERCHANDISE", Decimal("200.00")),
    ]
    for i, (category, amount) in enumerate(categories):
        add_stable_spending(
            context,
            category_primary=category,
            months=months,
            monthly_amount=amount,
            seed=seed + 200 + i if seed else None,
        )

    analytics_result = compute_analytics(context)

    total_subscriptions = len(context.recurring_streams)
    total_monthly_subscriptions = sum(
        s.average_amount for s in context.recurring_streams
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=None,
        creep_scores=None,
        scenario_name="subscription_heavy_user",
        scenario_params={
            "months": months,
            "monthly_income": str(monthly_income),
            "total_subscriptions": total_subscriptions,
            "total_monthly_subscription_cost": str(total_monthly_subscriptions),
            "subscription_to_income_ratio": str(
                round(float(total_monthly_subscriptions / monthly_income) * 100, 1)
            ),
        },
    )


def subscription_price_increase_user(
    email: str | None = None,
    months_before_increase: int = 6,
    months_after_increase: int = 2,
    monthly_income: Decimal = Decimal("5000.00"),
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User with recent subscription price increases to detect.

    Creates:
        - User with checking ($6,000), savings ($15,000), and credit card accounts
        - Biweekly salary income ($5,000/month)
        - Subscriptions with price increases:
          Netflix ($15.99 -> $22.99), Spotify ($10.99 -> $11.99),
          Disney+ ($7.99 -> $13.99)
        - Stable subscriptions: YouTube Premium, Comcast, Verizon
        - Stable spending in FOOD_AND_DRINK ($500), GENERAL_MERCHANDISE ($300)

    Computes:
        - Spending analytics (periods, category spending)

    Use for:
        - Testing price increase detection algorithms
        - Verifying price change alert generation
        - Testing historical price comparison
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    total_months = months_before_increase + months_after_increase

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("6000.00"),
        savings_balance=Decimal("15000.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=total_months,
        seed=seed,
    )

    price_increases = [
        ("Netflix", Decimal("15.99"), Decimal("22.99")),
        ("Spotify", Decimal("10.99"), Decimal("11.99")),
        ("Disney+", Decimal("7.99"), Decimal("13.99")),
    ]

    for i, (merchant, old_price, new_price) in enumerate(price_increases):
        add_subscription_with_price_change(
            context,
            merchant_name=merchant,
            old_amount=old_price,
            new_amount=new_price,
            months_before_change=months_before_increase,
            months_after_change=months_after_increase,
            seed=seed + i if seed else None,
        )

    stable_subscriptions = [
        ("YouTube Premium", Decimal("13.99")),
        ("Comcast", Decimal("89.99")),
        ("Verizon", Decimal("85.00")),
    ]

    for i, (merchant, amount) in enumerate(stable_subscriptions):
        add_subscription(
            context,
            merchant_name=merchant,
            amount=amount,
            months=total_months,
            seed=seed + 100 + i if seed else None,
        )

    categories = [
        ("FOOD_AND_DRINK", Decimal("500.00")),
        ("GENERAL_MERCHANDISE", Decimal("300.00")),
    ]
    for i, (category, amount) in enumerate(categories):
        add_stable_spending(
            context,
            category_primary=category,
            months=total_months,
            monthly_amount=amount,
            seed=seed + 200 + i if seed else None,
        )

    analytics_result = compute_analytics(context)

    old_total = sum(old for _, old, _ in price_increases)
    new_total = sum(new for _, _, new in price_increases)
    increase_amount = new_total - old_total

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=None,
        creep_scores=None,
        scenario_name="subscription_price_increase_user",
        scenario_params={
            "months_before_increase": months_before_increase,
            "months_after_increase": months_after_increase,
            "monthly_income": str(monthly_income),
            "price_increases": [
                {"merchant": m, "old": str(o), "new": str(n)}
                for m, o, n in price_increases
            ],
            "total_monthly_increase": str(increase_amount),
        },
    )


def subscription_churn_user(
    email: str | None = None,
    months: int = 8,
    monthly_income: Decimal = Decimal("5000.00"),
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User who frequently cancels and adds subscriptions (high churn).

    Creates:
        - User with checking ($6,000), savings ($15,000), and credit card accounts
        - Biweekly salary income ($5,000/month)
        - Stable subscriptions (full 8 months): Comcast, Verizon, Spotify
        - Cancelled subscriptions (tombstoned):
          Netflix (6 months), HBO Max (4 months), Disney+ (3 months)
        - New subscriptions (recent): Hulu (2 months), Paramount+ (1 month)
        - Stable spending in FOOD_AND_DRINK ($500), GENERAL_MERCHANDISE ($300)

    Computes:
        - Spending analytics (periods, category spending)

    Use for:
        - Testing subscription lifecycle tracking (active/cancelled/new)
        - Verifying tombstoned subscription detection
        - Testing new subscription alerts
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("6000.00"),
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

    stable_subscriptions = [
        ("Comcast", Decimal("89.99")),
        ("Verizon", Decimal("85.00")),
        ("Spotify", Decimal("10.99")),
    ]

    for i, (merchant, amount) in enumerate(stable_subscriptions):
        add_subscription(
            context,
            merchant_name=merchant,
            amount=amount,
            months=months,
            seed=seed + i if seed else None,
        )

    cancelled_subscriptions = [
        ("Netflix", Decimal("15.99"), 6),
        ("HBO Max", Decimal("15.99"), 4),
        ("Disney+", Decimal("13.99"), 3),
    ]

    for i, (merchant, amount, active_months) in enumerate(cancelled_subscriptions):
        add_cancelled_subscription(
            context,
            merchant_name=merchant,
            amount=amount,
            active_months=active_months,
            seed=seed + 100 + i if seed else None,
        )

    new_subscriptions = [
        ("Hulu", Decimal("17.99"), 2),
        ("Paramount+", Decimal("11.99"), 1),
    ]

    for i, (merchant, amount, active_months) in enumerate(new_subscriptions):
        add_subscription(
            context,
            merchant_name=merchant,
            amount=amount,
            months=active_months,
            seed=seed + 200 + i if seed else None,
        )

    categories = [
        ("FOOD_AND_DRINK", Decimal("500.00")),
        ("GENERAL_MERCHANDISE", Decimal("300.00")),
    ]
    for i, (category, amount) in enumerate(categories):
        add_stable_spending(
            context,
            category_primary=category,
            months=months,
            monthly_amount=amount,
            seed=seed + 300 + i if seed else None,
        )

    analytics_result = compute_analytics(context)

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=None,
        creep_scores=None,
        scenario_name="subscription_churn_user",
        scenario_params={
            "months": months,
            "monthly_income": str(monthly_income),
            "stable_subscriptions": len(stable_subscriptions),
            "cancelled_subscriptions": len(cancelled_subscriptions),
            "new_subscriptions": len(new_subscriptions),
        },
    )


def minimal_subscriptions_user(
    email: str | None = None,
    months: int = 6,
    monthly_income: Decimal = Decimal("5000.00"),
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User with only essential subscriptions (utilities only, no streaming).

    Creates:
        - User with checking ($8,000), savings ($20,000), and credit card accounts
        - Biweekly salary income ($5,000/month)
        - Essential subscriptions only: Verizon ($85), Con Edison ($120)
        - Stable spending in FOOD_AND_DRINK ($600), GENERAL_MERCHANDISE ($400),
          ENTERTAINMENT ($200), PERSONAL_CARE ($150)

    Computes:
        - Spending analytics (periods, category spending)

    Use for:
        - Control group for subscription analysis
        - Testing low subscription-to-income ratio scenarios
        - Verifying essential vs discretionary subscription classification
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

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
        months=months,
        seed=seed,
    )

    essential_only = [
        ("Verizon", Decimal("85.00")),
        ("Con Edison", Decimal("120.00")),
    ]

    for i, (merchant, amount) in enumerate(essential_only):
        add_subscription(
            context,
            merchant_name=merchant,
            amount=amount,
            months=months,
            category_primary="RENT_AND_UTILITIES" if "Edison" in merchant else "GENERAL_SERVICES",
            seed=seed + i if seed else None,
        )

    categories = [
        ("FOOD_AND_DRINK", Decimal("600.00")),
        ("GENERAL_MERCHANDISE", Decimal("400.00")),
        ("ENTERTAINMENT", Decimal("200.00")),
        ("PERSONAL_CARE", Decimal("150.00")),
    ]
    for i, (category, amount) in enumerate(categories):
        add_stable_spending(
            context,
            category_primary=category,
            months=months,
            monthly_amount=amount,
            seed=seed + 100 + i if seed else None,
        )

    analytics_result = compute_analytics(context)

    total_subscriptions = len(context.recurring_streams)
    total_monthly_subscriptions = sum(
        s.average_amount for s in context.recurring_streams
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=None,
        creep_scores=None,
        scenario_name="minimal_subscriptions_user",
        scenario_params={
            "months": months,
            "monthly_income": str(monthly_income),
            "total_subscriptions": total_subscriptions,
            "total_monthly_subscription_cost": str(total_monthly_subscriptions),
            "subscription_to_income_ratio": str(
                round(float(total_monthly_subscriptions / monthly_income) * 100, 1)
            ),
        },
    )
