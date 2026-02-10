from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Literal

from ...context import TestContext
from ...generators import generate_recurring_dates
from ...generators.amounts import generate_subscription_amounts
from ...generators.dates import months_ago
from ...generators.merchants import MerchantInfo, get_merchant_by_name
from ..atomic import create_recurring_stream, create_transactions
from ..atomic.transaction import TransactionData


Frequency = Literal["weekly", "biweekly", "monthly", "quarterly", "annually"]


def add_subscription(
    context: TestContext,
    merchant_name: str = "Netflix",
    amount: Decimal = Decimal("15.99"),
    frequency: Frequency = "monthly",
    months: int = 6,
    category_primary: str | None = None,
    category_detailed: str | None = None,
    jitter_days: int = 1,
    create_stream: bool = True,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    effective_seed = seed or context.seed
    ref_date = context.get_reference_date()

    merchant = get_merchant_by_name(merchant_name)
    final_category_primary = category_primary or (
        merchant.category_primary if merchant else "ENTERTAINMENT"
    )
    final_category_detailed = category_detailed or (
        merchant.category_detailed if merchant else "ENTERTAINMENT_STREAMING"
    )

    occurrences = _calculate_occurrences(months, frequency)
    start_date = months_ago(months, ref_date)

    dates = generate_recurring_dates(
        start_date,
        frequency,
        occurrences,
        jitter_days=jitter_days,
        seed=effective_seed,
    )

    dates = [d for d in dates if d <= ref_date]

    amounts = generate_subscription_amounts(amount, len(dates))

    transactions = [
        TransactionData(
            amount=amt,
            date=d,
            category_primary=final_category_primary,
            category_detailed=final_category_detailed,
            merchant_name=merchant_name,
            name=f"{merchant_name} Subscription",
        )
        for d, amt in zip(dates, amounts)
    ]

    create_transactions(context, transactions, account_key=account_key)

    if create_stream and dates:
        create_recurring_stream(
            context,
            stream_type="outflow",
            description=f"{merchant_name} Subscription",
            merchant_name=merchant_name,
            average_amount=amount,
            frequency=frequency,
            category_primary=final_category_primary,
            category_detailed=final_category_detailed,
            first_date=dates[0],
            last_date=dates[-1],
            account_key=account_key,
        )

    return context


def add_subscription_with_price_change(
    context: TestContext,
    merchant_name: str = "Netflix",
    old_amount: Decimal = Decimal("15.99"),
    new_amount: Decimal = Decimal("22.99"),
    months_before_change: int = 6,
    months_after_change: int = 2,
    frequency: Frequency = "monthly",
    category_primary: str | None = None,
    category_detailed: str | None = None,
    jitter_days: int = 1,
    create_stream: bool = True,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    effective_seed = seed or context.seed
    ref_date = context.get_reference_date()

    merchant = get_merchant_by_name(merchant_name)
    final_category_primary = category_primary or (
        merchant.category_primary if merchant else "ENTERTAINMENT"
    )
    final_category_detailed = category_detailed or (
        merchant.category_detailed if merchant else "ENTERTAINMENT_STREAMING"
    )

    total_months = months_before_change + months_after_change
    occurrences = _calculate_occurrences(total_months, frequency)
    start_date = months_ago(total_months, ref_date)

    dates = generate_recurring_dates(
        start_date,
        frequency,
        occurrences,
        jitter_days=jitter_days,
        seed=effective_seed,
    )

    dates = [d for d in dates if d <= ref_date]

    change_at = _calculate_occurrences(months_before_change, frequency)
    amounts = generate_subscription_amounts(
        old_amount,
        len(dates),
        price_change_at=change_at,
        new_amount=new_amount,
    )

    transactions = [
        TransactionData(
            amount=amt,
            date=d,
            category_primary=final_category_primary,
            category_detailed=final_category_detailed,
            merchant_name=merchant_name,
            name=f"{merchant_name} Subscription",
        )
        for d, amt in zip(dates, amounts)
    ]

    create_transactions(context, transactions, account_key=account_key)

    if create_stream and dates:
        create_recurring_stream(
            context,
            stream_type="outflow",
            description=f"{merchant_name} Subscription",
            merchant_name=merchant_name,
            average_amount=new_amount,
            frequency=frequency,
            category_primary=final_category_primary,
            category_detailed=final_category_detailed,
            first_date=dates[0],
            last_date=dates[-1],
            account_key=account_key,
        )

    return context


def add_cancelled_subscription(
    context: TestContext,
    merchant_name: str = "Netflix",
    amount: Decimal = Decimal("15.99"),
    active_months: int = 6,
    frequency: Frequency = "monthly",
    category_primary: str | None = None,
    category_detailed: str | None = None,
    jitter_days: int = 1,
    create_stream: bool = True,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    effective_seed = seed or context.seed
    ref_date = context.get_reference_date()

    merchant = get_merchant_by_name(merchant_name)
    final_category_primary = category_primary or (
        merchant.category_primary if merchant else "ENTERTAINMENT"
    )
    final_category_detailed = category_detailed or (
        merchant.category_detailed if merchant else "ENTERTAINMENT_STREAMING"
    )

    months_ago_cancelled = 1
    total_months_back = active_months + months_ago_cancelled

    occurrences = _calculate_occurrences(active_months, frequency)
    start_date = months_ago(total_months_back, ref_date)

    dates = generate_recurring_dates(
        start_date,
        frequency,
        occurrences,
        jitter_days=jitter_days,
        seed=effective_seed,
    )

    cancellation_date = months_ago(months_ago_cancelled, ref_date)
    dates = [d for d in dates if d <= cancellation_date]

    amounts = generate_subscription_amounts(amount, len(dates))

    transactions = [
        TransactionData(
            amount=amt,
            date=d,
            category_primary=final_category_primary,
            category_detailed=final_category_detailed,
            merchant_name=merchant_name,
            name=f"{merchant_name} Subscription",
        )
        for d, amt in zip(dates, amounts)
    ]

    create_transactions(context, transactions, account_key=account_key)

    if create_stream and dates:
        create_recurring_stream(
            context,
            stream_type="outflow",
            description=f"{merchant_name} Subscription",
            merchant_name=merchant_name,
            average_amount=amount,
            frequency=frequency,
            category_primary=final_category_primary,
            category_detailed=final_category_detailed,
            first_date=dates[0],
            last_date=dates[-1],
            is_active=False,
            status="tombstoned",
            account_key=account_key,
        )

    return context


def _calculate_occurrences(months: int, frequency: Frequency) -> int:
    if frequency == "weekly":
        return months * 4
    elif frequency == "biweekly":
        return months * 2
    elif frequency == "monthly":
        return months
    elif frequency == "quarterly":
        return max(1, months // 3)
    elif frequency == "annually":
        return max(1, months // 12)
    return months
