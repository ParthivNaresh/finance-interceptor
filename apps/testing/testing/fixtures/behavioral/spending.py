from __future__ import annotations

import random
from datetime import date
from decimal import Decimal
from uuid import UUID

from ...context import TestContext
from ...generators import (
    DateRange,
    generate_amounts_with_variance,
    generate_transaction_dates,
    get_merchants_for_category,
    get_period_range,
)
from ...generators.amounts import generate_increasing_amounts
from ..atomic import create_transactions
from ..atomic.transaction import TransactionData


def add_stable_spending(
    context: TestContext,
    category_primary: str = "FOOD_AND_DRINK",
    months: int = 3,
    monthly_amount: Decimal = Decimal("400.00"),
    transactions_per_month: int = 8,
    variance_pct: float = 0.15,
    account_key: str | None = None,
    start_months_ago: int | None = None,
    seed: int | None = None,
) -> TestContext:
    effective_seed = seed or context.seed
    rng = random.Random(effective_seed)
    ref_date = context.get_reference_date()

    merchants = get_merchants_for_category(category_primary, 5, seed=effective_seed)
    all_transactions: list[TransactionData] = []

    if start_months_ago is not None:
        month_offsets = range(start_months_ago, start_months_ago - months, -1)
    else:
        month_offsets = range(months, 0, -1)

    for month_offset in month_offsets:
        date_range = get_period_range(month_offset, from_date=ref_date)

        dates = generate_transaction_dates(
            date_range,
            transactions_per_month,
            distribution="uniform",
            seed=effective_seed + month_offset if effective_seed else None,
        )

        amounts = generate_amounts_with_variance(
            monthly_amount,
            transactions_per_month,
            variance_pct=variance_pct,
            seed=effective_seed + month_offset if effective_seed else None,
        )

        for txn_date, amount in zip(dates, amounts):
            merchant = merchants[rng.randint(0, len(merchants) - 1)]
            all_transactions.append(
                TransactionData.expense(
                    amount=amount,
                    date=txn_date,
                    category_primary=merchant.category_primary,
                    merchant_name=merchant.name,
                )
            )

    create_transactions(context, all_transactions, account_key=account_key)

    return context


def add_gradual_increase(
    context: TestContext,
    category_primary: str = "FOOD_AND_DRINK",
    months: int = 6,
    start_monthly_amount: Decimal = Decimal("300.00"),
    end_monthly_amount: Decimal = Decimal("500.00"),
    transactions_per_month: int = 8,
    variance_pct: float = 0.10,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    effective_seed = seed or context.seed
    rng = random.Random(effective_seed)
    ref_date = context.get_reference_date()

    merchants = get_merchants_for_category(category_primary, 5, seed=effective_seed)

    monthly_targets = generate_increasing_amounts(
        start_monthly_amount,
        end_monthly_amount,
        months,
        noise_pct=0.05,
        seed=effective_seed,
    )

    all_transactions: list[TransactionData] = []

    for month_idx, monthly_target in enumerate(monthly_targets):
        month_offset = months - month_idx

        date_range = get_period_range(month_offset, from_date=ref_date)

        dates = generate_transaction_dates(
            date_range,
            transactions_per_month,
            distribution="uniform",
            seed=effective_seed + month_offset if effective_seed else None,
        )

        amounts = generate_amounts_with_variance(
            monthly_target,
            transactions_per_month,
            variance_pct=variance_pct,
            seed=effective_seed + month_offset if effective_seed else None,
        )

        for txn_date, amount in zip(dates, amounts):
            merchant = merchants[rng.randint(0, len(merchants) - 1)]
            all_transactions.append(
                TransactionData.expense(
                    amount=amount,
                    date=txn_date,
                    category_primary=merchant.category_primary,
                    merchant_name=merchant.name,
                )
            )

    create_transactions(context, all_transactions, account_key=account_key)

    return context


def add_spending_spike(
    context: TestContext,
    category_primary: str = "GENERAL_MERCHANDISE",
    amount: Decimal = Decimal("500.00"),
    spike_date: date | None = None,
    merchant_name: str | None = None,
    account_key: str | None = None,
) -> TestContext:
    ref_date = context.get_reference_date()
    final_date = spike_date or ref_date

    from ...generators import get_merchant_for_category

    if merchant_name is None:
        merchant = get_merchant_for_category(category_primary)
        merchant_name = merchant.name

    transaction = TransactionData.expense(
        amount=amount,
        date=final_date,
        category_primary=category_primary,
        merchant_name=merchant_name,
    )

    create_transactions(context, [transaction], account_key=account_key)

    return context


def add_random_spending(
    context: TestContext,
    months: int = 3,
    total_monthly_amount: Decimal = Decimal("2000.00"),
    category_weights: dict[str, float] | None = None,
    transactions_per_month: int = 30,
    variance_pct: float = 0.20,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    effective_seed = seed or context.seed
    rng = random.Random(effective_seed)
    ref_date = context.get_reference_date()

    weights = category_weights or {
        "FOOD_AND_DRINK": 0.30,
        "GENERAL_MERCHANDISE": 0.25,
        "ENTERTAINMENT": 0.10,
        "PERSONAL_CARE": 0.10,
        "TRAVEL": 0.15,
        "GENERAL_SERVICES": 0.10,
    }

    total_weight = sum(weights.values())
    normalized_weights = {k: v / total_weight for k, v in weights.items()}

    category_merchants = {
        cat: get_merchants_for_category(cat, 3, seed=effective_seed)
        for cat in weights.keys()
    }

    all_transactions: list[TransactionData] = []

    for month_offset in range(months, 0, -1):
        date_range = get_period_range(month_offset, from_date=ref_date)

        dates = generate_transaction_dates(
            date_range,
            transactions_per_month,
            distribution="weighted_recent",
            seed=effective_seed + month_offset if effective_seed else None,
        )

        amounts = generate_amounts_with_variance(
            total_monthly_amount,
            transactions_per_month,
            variance_pct=variance_pct,
            seed=effective_seed + month_offset if effective_seed else None,
        )

        for txn_date, amount in zip(dates, amounts):
            category = _weighted_choice(normalized_weights, rng)
            merchants = category_merchants[category]
            merchant = merchants[rng.randint(0, len(merchants) - 1)]

            all_transactions.append(
                TransactionData.expense(
                    amount=amount,
                    date=txn_date,
                    category_primary=merchant.category_primary,
                    merchant_name=merchant.name,
                )
            )

    create_transactions(context, all_transactions, account_key=account_key)

    return context


def _weighted_choice(weights: dict[str, float], rng: random.Random) -> str:
    total = sum(weights.values())
    r = rng.random() * total
    cumulative = 0.0

    for key, weight in weights.items():
        cumulative += weight
        if r <= cumulative:
            return key

    return list(weights.keys())[-1]
