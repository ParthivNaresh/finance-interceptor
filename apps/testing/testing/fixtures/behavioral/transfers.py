from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Literal

from ...context import TestContext
from ...generators import generate_recurring_dates
from ...generators.dates import months_ago
from ..atomic import create_transactions
from ..atomic.transaction import TransactionData


Frequency = Literal["weekly", "biweekly", "monthly"]


def add_savings_transfers(
    context: TestContext,
    amount: Decimal = Decimal("500.00"),
    frequency: Frequency = "monthly",
    months: int = 3,
    from_account_key: str = "checking",
    to_account_key: str = "savings",
    jitter_days: int = 1,
    seed: int | None = None,
) -> TestContext:
    effective_seed = seed or context.seed
    ref_date = context.get_reference_date()

    if from_account_key not in context.accounts:
        raise ValueError(f"Account '{from_account_key}' not found in context")
    if to_account_key not in context.accounts:
        raise ValueError(f"Account '{to_account_key}' not found in context")

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

    outgoing_transactions = [
        TransactionData.transfer_out(
            amount=amount,
            date=d,
            description=f"Transfer to {to_account_key.title()}",
        )
        for d in dates
    ]

    incoming_transactions = [
        TransactionData.transfer_in(
            amount=amount,
            date=d,
            description=f"Transfer from {from_account_key.title()}",
        )
        for d in dates
    ]

    create_transactions(context, outgoing_transactions, account_key=from_account_key)
    create_transactions(context, incoming_transactions, account_key=to_account_key)

    return context


def add_paired_transfers(
    context: TestContext,
    amount: Decimal,
    transfer_date: date | None = None,
    from_account_key: str = "checking",
    to_account_key: str = "savings",
    description: str | None = None,
) -> TestContext:
    ref_date = context.get_reference_date()
    final_date = transfer_date or ref_date

    if from_account_key not in context.accounts:
        raise ValueError(f"Account '{from_account_key}' not found in context")
    if to_account_key not in context.accounts:
        raise ValueError(f"Account '{to_account_key}' not found in context")

    out_description = description or f"Transfer to {to_account_key.title()}"
    in_description = description or f"Transfer from {from_account_key.title()}"

    outgoing = TransactionData.transfer_out(
        amount=amount,
        date=final_date,
        description=out_description,
    )

    incoming = TransactionData.transfer_in(
        amount=amount,
        date=final_date,
        description=in_description,
    )

    create_transactions(context, [outgoing], account_key=from_account_key)
    create_transactions(context, [incoming], account_key=to_account_key)

    return context


def _calculate_occurrences(months: int, frequency: Frequency) -> int:
    if frequency == "weekly":
        return months * 4
    elif frequency == "biweekly":
        return months * 2
    else:
        return months
