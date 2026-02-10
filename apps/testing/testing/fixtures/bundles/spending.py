from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from ...context import TestContext
from ..behavioral.spending import add_stable_spending


@dataclass
class CategorySpendingSpec:
    category_primary: str
    monthly_amount: Decimal
    transactions_per_month: int = 8
    variance_pct: float = 0.15


ESSENTIAL_SPENDING: list[CategorySpendingSpec] = [
    CategorySpendingSpec(
        category_primary="FOOD_AND_DRINK",
        monthly_amount=Decimal("600.00"),
        transactions_per_month=15,
    ),
    CategorySpendingSpec(
        category_primary="TRAVEL",
        monthly_amount=Decimal("150.00"),
        transactions_per_month=10,
    ),
    CategorySpendingSpec(
        category_primary="PERSONAL_CARE",
        monthly_amount=Decimal("100.00"),
        transactions_per_month=4,
    ),
]

LIFESTYLE_SPENDING: list[CategorySpendingSpec] = [
    CategorySpendingSpec(
        category_primary="ENTERTAINMENT",
        monthly_amount=Decimal("150.00"),
        transactions_per_month=5,
    ),
    CategorySpendingSpec(
        category_primary="GENERAL_MERCHANDISE",
        monthly_amount=Decimal("300.00"),
        transactions_per_month=8,
        variance_pct=0.25,
    ),
]

FULL_SPENDING: list[CategorySpendingSpec] = ESSENTIAL_SPENDING + LIFESTYLE_SPENDING


def add_essential_spending_bundle(
    context: TestContext,
    months: int = 3,
    spending_specs: list[CategorySpendingSpec] | None = None,
    scale_factor: float = 1.0,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    specs = spending_specs or ESSENTIAL_SPENDING

    for i, spec in enumerate(specs):
        scaled_amount = spec.monthly_amount * Decimal(str(scale_factor))

        add_stable_spending(
            context,
            category_primary=spec.category_primary,
            months=months,
            monthly_amount=scaled_amount,
            transactions_per_month=spec.transactions_per_month,
            variance_pct=spec.variance_pct,
            account_key=account_key,
            seed=seed + i * 100 if seed else None,
        )

    return context


def add_lifestyle_spending_bundle(
    context: TestContext,
    months: int = 3,
    spending_specs: list[CategorySpendingSpec] | None = None,
    scale_factor: float = 1.0,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    specs = spending_specs or LIFESTYLE_SPENDING

    for i, spec in enumerate(specs):
        scaled_amount = spec.monthly_amount * Decimal(str(scale_factor))

        add_stable_spending(
            context,
            category_primary=spec.category_primary,
            months=months,
            monthly_amount=scaled_amount,
            transactions_per_month=spec.transactions_per_month,
            variance_pct=spec.variance_pct,
            account_key=account_key,
            seed=seed + i * 100 if seed else None,
        )

    return context


def add_full_spending_bundle(
    context: TestContext,
    months: int = 3,
    spending_specs: list[CategorySpendingSpec] | None = None,
    scale_factor: float = 1.0,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    specs = spending_specs or FULL_SPENDING

    for i, spec in enumerate(specs):
        scaled_amount = spec.monthly_amount * Decimal(str(scale_factor))

        add_stable_spending(
            context,
            category_primary=spec.category_primary,
            months=months,
            monthly_amount=scaled_amount,
            transactions_per_month=spec.transactions_per_month,
            variance_pct=spec.variance_pct,
            account_key=account_key,
            seed=seed + i * 100 if seed else None,
        )

    return context
