from __future__ import annotations

from datetime import date
from decimal import Decimal

from ...context import TestContext
from ..behavioral.account_setup import create_user_with_full_bank
from ..behavioral.analytics import compute_analytics
from ..behavioral.income import add_salary_income, add_variable_income
from ..behavioral.transfers import add_savings_transfers
from ..bundles.spending import add_full_spending_bundle
from ..bundles.subscriptions import add_common_subscriptions_bundle
from .expectations import ExpectedOutcomes
from .result import ScenarioResult


def positive_cash_flow_user(
    email: str | None = None,
    months: int = 6,
    monthly_income: Decimal = Decimal("6000.00"),
    monthly_expenses: Decimal = Decimal("4000.00"),
    savings_transfer_amount: Decimal = Decimal("500.00"),
    include_subscriptions: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    Financially healthy user with income exceeding expenses (33% savings rate).

    Creates:
        - User with checking ($12,000), savings ($30,000), and credit card accounts
        - Biweekly salary income ($6,000/month)
        - Full spending bundle scaled to 70% of expenses
        - Common subscriptions (streaming + utilities)
        - Monthly savings transfers ($500) from checking to savings

    Computes:
        - Spending analytics (periods, category spending)

    Use for:
        - Testing cash flow analysis with positive net income
        - Verifying savings rate calculations
        - Testing transfer detection between accounts
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("12000.00"),
        savings_balance=Decimal("30000.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=months,
        seed=seed,
    )

    discretionary_budget = monthly_expenses * Decimal("0.7")
    scale_factor = float(discretionary_budget / Decimal("1300.00"))
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

    add_savings_transfers(
        context,
        amount=savings_transfer_amount,
        frequency="monthly",
        months=months,
        seed=seed,
    )

    analytics_result = compute_analytics(context)

    expected = ExpectedOutcomes(
        positive_cash_flow=True,
        min_spending_periods=months,
        min_transactions=50,
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=None,
        creep_scores=None,
        scenario_name="positive_cash_flow_user",
        scenario_params={
            "months": months,
            "monthly_income": str(monthly_income),
            "monthly_expenses": str(monthly_expenses),
            "savings_transfer_amount": str(savings_transfer_amount),
            "expected_savings_rate": str(
                round((monthly_income - monthly_expenses) / monthly_income * 100, 1)
            ),
        },
        expected=expected,
    )


def negative_cash_flow_user(
    email: str | None = None,
    months: int = 6,
    monthly_income: Decimal = Decimal("4000.00"),
    monthly_expenses: Decimal = Decimal("5000.00"),
    include_subscriptions: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User living beyond their means with expenses exceeding income ($1,000/month deficit).

    Creates:
        - User with checking ($3,000), savings ($5,000), credit card ($2,500 balance)
        - Biweekly salary income ($4,000/month)
        - Full spending bundle scaled to 65% of expenses
        - Extended subscriptions (streaming + utilities + fitness + productivity)
        - No savings transfers (spending exceeds income)

    Computes:
        - Spending analytics (periods, category spending)

    Use for:
        - Testing negative cash flow detection
        - Verifying deficit calculations
        - Testing financial health warnings/alerts
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("3000.00"),
        savings_balance=Decimal("5000.00"),
        credit_balance=Decimal("2500.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=months,
        seed=seed,
    )

    discretionary_budget = monthly_expenses * Decimal("0.65")
    scale_factor = float(discretionary_budget / Decimal("1300.00"))
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
            include_fitness=True,
            include_productivity=True,
            seed=seed,
        )

    analytics_result = compute_analytics(context)

    expected = ExpectedOutcomes(
        positive_cash_flow=False,
        min_spending_periods=months,
        min_recurring_streams=8,
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=None,
        creep_scores=None,
        scenario_name="negative_cash_flow_user",
        scenario_params={
            "months": months,
            "monthly_income": str(monthly_income),
            "monthly_expenses": str(monthly_expenses),
            "monthly_deficit": str(monthly_expenses - monthly_income),
        },
        expected=expected,
    )


def variable_income_user(
    email: str | None = None,
    months: int = 6,
    base_monthly_income: Decimal = Decimal("3000.00"),
    income_variance_pct: float = 0.40,
    monthly_expenses: Decimal = Decimal("3500.00"),
    include_subscriptions: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    Freelancer/gig worker with irregular income (40% variance month-to-month).

    Creates:
        - User with checking ($5,000), savings ($8,000), and credit card accounts
        - Variable income (~$3,000/month average, 3 deposits/month, ±40% variance)
        - Full spending bundle scaled to 60% of expenses
        - Common subscriptions (streaming + utilities)

    Computes:
        - Spending analytics (periods, category spending)

    Use for:
        - Testing income detection with irregular deposits
        - Verifying income averaging algorithms
        - Testing cash flow analysis with variable income patterns
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("5000.00"),
        savings_balance=Decimal("8000.00"),
        context=context,
    )

    add_variable_income(
        context,
        average_amount=base_monthly_income,
        variance_pct=income_variance_pct,
        deposits_per_month=3,
        months=months,
        seed=seed,
    )

    discretionary_budget = monthly_expenses * Decimal("0.6")
    scale_factor = float(discretionary_budget / Decimal("1300.00"))
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

    expected = ExpectedOutcomes(
        min_spending_periods=months,
        min_transactions=50,
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=None,
        creep_scores=None,
        scenario_name="variable_income_user",
        scenario_params={
            "months": months,
            "base_monthly_income": str(base_monthly_income),
            "income_variance_pct": income_variance_pct,
            "monthly_expenses": str(monthly_expenses),
        },
        expected=expected,
    )


def paycheck_to_paycheck_user(
    email: str | None = None,
    months: int = 6,
    monthly_income: Decimal = Decimal("4500.00"),
    buffer_amount: Decimal = Decimal("200.00"),
    include_subscriptions: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    User with minimal savings buffer (4.4% savings rate, ~$200/month).

    Creates:
        - User with checking ($800), savings ($500), and credit card accounts
        - Biweekly salary income ($4,500/month)
        - Full spending bundle scaled to 55% of expenses
        - Common subscriptions (streaming + utilities)
        - No explicit savings transfers (minimal buffer)

    Computes:
        - Spending analytics (periods, category spending)

    Use for:
        - Testing low savings rate detection
        - Verifying financial vulnerability indicators
        - Testing emergency fund recommendations
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("800.00"),
        savings_balance=Decimal("500.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=months,
        seed=seed,
    )

    monthly_expenses = monthly_income - buffer_amount
    discretionary_budget = monthly_expenses * Decimal("0.55")
    scale_factor = float(discretionary_budget / Decimal("1300.00"))
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

    expected = ExpectedOutcomes(
        positive_cash_flow=True,
        min_spending_periods=months,
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=None,
        creep_scores=None,
        scenario_name="paycheck_to_paycheck_user",
        scenario_params={
            "months": months,
            "monthly_income": str(monthly_income),
            "monthly_expenses": str(monthly_expenses),
            "buffer_amount": str(buffer_amount),
            "savings_rate_pct": str(round(float(buffer_amount / monthly_income) * 100, 1)),
        },
        expected=expected,
    )


def high_saver_user(
    email: str | None = None,
    months: int = 6,
    monthly_income: Decimal = Decimal("8000.00"),
    savings_rate_pct: float = 0.35,
    include_subscriptions: bool = True,
    reference_date: date | None = None,
    seed: int | None = None,
) -> ScenarioResult:
    """
    Aggressive saver with high income and 35% savings rate ($2,800/month saved).

    Creates:
        - User with checking ($15,000), savings ($75,000), and credit card accounts
        - Biweekly salary income ($8,000/month)
        - Full spending bundle scaled to 50% of expenses (frugal lifestyle)
        - Common subscriptions (streaming + utilities)
        - Monthly savings transfers ($2,800) from checking to savings

    Computes:
        - Spending analytics (periods, category spending)

    Use for:
        - Testing high savings rate detection
        - Verifying transfer pattern analysis
        - Testing wealth accumulation projections
    """
    context = TestContext()

    if reference_date:
        context.with_reference_date(reference_date)
    if seed:
        context.with_seed(seed)

    create_user_with_full_bank(
        email=email,
        checking_balance=Decimal("15000.00"),
        savings_balance=Decimal("75000.00"),
        context=context,
    )

    add_salary_income(
        context,
        amount=monthly_income / 2,
        frequency="biweekly",
        months=months,
        seed=seed,
    )

    monthly_savings = monthly_income * Decimal(str(savings_rate_pct))
    monthly_expenses = monthly_income - monthly_savings

    discretionary_budget = monthly_expenses * Decimal("0.5")
    scale_factor = float(discretionary_budget / Decimal("1300.00"))
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

    add_savings_transfers(
        context,
        amount=monthly_savings,
        frequency="monthly",
        months=months,
        seed=seed,
    )

    analytics_result = compute_analytics(context)

    expected = ExpectedOutcomes(
        positive_cash_flow=True,
        min_spending_periods=months,
        min_transactions=50,
    )

    return ScenarioResult(
        context=context,
        analytics=analytics_result,
        baselines=None,
        creep_scores=None,
        scenario_name="high_saver_user",
        scenario_params={
            "months": months,
            "monthly_income": str(monthly_income),
            "monthly_savings": str(monthly_savings),
            "savings_rate_pct": savings_rate_pct,
        },
        expected=expected,
    )
