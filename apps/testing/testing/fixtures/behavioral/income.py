from __future__ import annotations

import random
from datetime import date
from decimal import Decimal
from typing import Literal

from ...context import TestContext
from ...generators import generate_recurring_dates, get_period_range
from ...generators.amounts import generate_amount_with_variance
from ..atomic import create_transactions
from ..atomic.transaction import TransactionData


Frequency = Literal["weekly", "biweekly", "monthly"]


def add_salary_income(
    context: TestContext,
    amount: Decimal = Decimal("3500.00"),
    frequency: Frequency = "biweekly",
    months: int = 3,
    source_name: str = "ACME Corp Payroll",
    jitter_days: int = 1,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    effective_seed = seed or context.seed
    ref_date = context.get_reference_date()

    occurrences = _calculate_occurrences(months, frequency)

    start_date = _calculate_start_date(ref_date, months, frequency)

    dates = generate_recurring_dates(
        start_date,
        frequency,
        occurrences,
        jitter_days=jitter_days,
        seed=effective_seed,
    )

    dates = [d for d in dates if d <= ref_date]

    transactions = [
        TransactionData.income(amount=amount, date=d, source_name=source_name)
        for d in dates
    ]

    create_transactions(context, transactions, account_key=account_key)

    return context


def add_variable_income(
    context: TestContext,
    average_amount: Decimal = Decimal("2000.00"),
    months: int = 3,
    deposits_per_month: int = 2,
    variance_pct: float = 0.30,
    source_name: str = "Freelance Payment",
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    effective_seed = seed or context.seed
    rng = random.Random(effective_seed)
    ref_date = context.get_reference_date()

    all_transactions: list[TransactionData] = []

    for month_offset in range(months, 0, -1):
        date_range = get_period_range(month_offset, from_date=ref_date)

        for i in range(deposits_per_month):
            deposit_date = date_range.random_date(rng)

            amount = generate_amount_with_variance(
                average_amount / deposits_per_month,
                variance_pct=variance_pct,
                min_amount=Decimal("50.00"),
                seed=effective_seed + month_offset + i if effective_seed else None,
            )

            all_transactions.append(
                TransactionData.income(
                    amount=amount,
                    date=deposit_date,
                    source_name=source_name,
                )
            )

    create_transactions(context, all_transactions, account_key=account_key)

    return context


def add_one_time_income(
    context: TestContext,
    amount: Decimal = Decimal("1000.00"),
    income_date: date | None = None,
    source_name: str = "Bonus Payment",
    category_detailed: str = "INCOME_OTHER",
    account_key: str | None = None,
) -> TestContext:
    ref_date = context.get_reference_date()
    final_date = income_date or ref_date

    transaction = TransactionData(
        amount=-abs(amount),
        date=final_date,
        category_primary="INCOME",
        category_detailed=category_detailed,
        merchant_name=source_name,
        name=source_name,
    )

    create_transactions(context, [transaction], account_key=account_key)

    return context


def _calculate_occurrences(months: int, frequency: Frequency) -> int:
    if frequency == "weekly":
        return months * 4
    elif frequency == "biweekly":
        return months * 2
    else:
        return months


def _calculate_start_date(ref_date: date, months: int, frequency: Frequency) -> date:
    from datetime import timedelta

    if frequency == "weekly":
        return ref_date - timedelta(weeks=months * 4)
    elif frequency == "biweekly":
        return ref_date - timedelta(weeks=months * 2)
    else:
        from ...generators.dates import months_ago
        return months_ago(months, ref_date)
