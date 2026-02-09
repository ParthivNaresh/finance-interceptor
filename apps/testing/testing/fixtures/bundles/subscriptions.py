from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from ...context import TestContext
from ..behavioral.subscriptions import add_subscription


Frequency = Literal["weekly", "biweekly", "monthly", "quarterly", "annually"]


@dataclass
class SubscriptionSpec:
    merchant_name: str
    amount: Decimal
    frequency: Frequency = "monthly"
    category_primary: str = "ENTERTAINMENT"
    category_detailed: str = "ENTERTAINMENT_STREAMING"


STREAMING_SUBSCRIPTIONS: list[SubscriptionSpec] = [
    SubscriptionSpec(
        merchant_name="Netflix",
        amount=Decimal("15.99"),
        category_detailed="ENTERTAINMENT_STREAMING",
    ),
    SubscriptionSpec(
        merchant_name="Spotify",
        amount=Decimal("10.99"),
        category_detailed="ENTERTAINMENT_STREAMING",
    ),
    SubscriptionSpec(
        merchant_name="Disney+",
        amount=Decimal("13.99"),
        category_detailed="ENTERTAINMENT_STREAMING",
    ),
    SubscriptionSpec(
        merchant_name="YouTube Premium",
        amount=Decimal("13.99"),
        category_detailed="ENTERTAINMENT_STREAMING",
    ),
]

UTILITIES_SUBSCRIPTIONS: list[SubscriptionSpec] = [
    SubscriptionSpec(
        merchant_name="Comcast",
        amount=Decimal("89.99"),
        category_primary="GENERAL_SERVICES",
        category_detailed="GENERAL_SERVICES_CABLE",
    ),
    SubscriptionSpec(
        merchant_name="Verizon",
        amount=Decimal("85.00"),
        category_primary="GENERAL_SERVICES",
        category_detailed="GENERAL_SERVICES_TELECOMMUNICATION",
    ),
    SubscriptionSpec(
        merchant_name="Con Edison",
        amount=Decimal("120.00"),
        category_primary="RENT_AND_UTILITIES",
        category_detailed="RENT_AND_UTILITIES_ELECTRIC",
    ),
]

FITNESS_SUBSCRIPTIONS: list[SubscriptionSpec] = [
    SubscriptionSpec(
        merchant_name="Planet Fitness",
        amount=Decimal("24.99"),
        category_primary="PERSONAL_CARE",
        category_detailed="PERSONAL_CARE_GYMS",
    ),
]

PRODUCTIVITY_SUBSCRIPTIONS: list[SubscriptionSpec] = [
    SubscriptionSpec(
        merchant_name="iCloud Storage",
        amount=Decimal("2.99"),
        category_primary="GENERAL_SERVICES",
        category_detailed="GENERAL_SERVICES_OTHER",
    ),
    SubscriptionSpec(
        merchant_name="Dropbox",
        amount=Decimal("11.99"),
        category_primary="GENERAL_SERVICES",
        category_detailed="GENERAL_SERVICES_OTHER",
    ),
]

PREMIUM_STREAMING_SUBSCRIPTIONS: list[SubscriptionSpec] = [
    SubscriptionSpec(
        merchant_name="HBO Max",
        amount=Decimal("15.99"),
        category_detailed="ENTERTAINMENT_STREAMING",
    ),
    SubscriptionSpec(
        merchant_name="Hulu",
        amount=Decimal("17.99"),
        category_detailed="ENTERTAINMENT_STREAMING",
    ),
    SubscriptionSpec(
        merchant_name="Paramount+",
        amount=Decimal("11.99"),
        category_detailed="ENTERTAINMENT_STREAMING",
    ),
    SubscriptionSpec(
        merchant_name="Apple TV+",
        amount=Decimal("9.99"),
        category_detailed="ENTERTAINMENT_STREAMING",
    ),
    SubscriptionSpec(
        merchant_name="Peacock",
        amount=Decimal("11.99"),
        category_detailed="ENTERTAINMENT_STREAMING",
    ),
]

NEWS_SUBSCRIPTIONS: list[SubscriptionSpec] = [
    SubscriptionSpec(
        merchant_name="New York Times",
        amount=Decimal("17.00"),
        category_primary="GENERAL_SERVICES",
        category_detailed="GENERAL_SERVICES_OTHER",
    ),
    SubscriptionSpec(
        merchant_name="Wall Street Journal",
        amount=Decimal("38.99"),
        category_primary="GENERAL_SERVICES",
        category_detailed="GENERAL_SERVICES_OTHER",
    ),
    SubscriptionSpec(
        merchant_name="The Athletic",
        amount=Decimal("9.99"),
        category_primary="ENTERTAINMENT",
        category_detailed="ENTERTAINMENT_OTHER",
    ),
]


def add_streaming_bundle(
    context: TestContext,
    months: int = 6,
    subscriptions: list[SubscriptionSpec] | None = None,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    specs = subscriptions or STREAMING_SUBSCRIPTIONS

    for i, spec in enumerate(specs):
        add_subscription(
            context,
            merchant_name=spec.merchant_name,
            amount=spec.amount,
            frequency=spec.frequency,
            months=months,
            category_primary=spec.category_primary,
            category_detailed=spec.category_detailed,
            account_key=account_key,
            seed=seed + i if seed else None,
        )

    return context


def add_utilities_bundle(
    context: TestContext,
    months: int = 6,
    subscriptions: list[SubscriptionSpec] | None = None,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    specs = subscriptions or UTILITIES_SUBSCRIPTIONS

    for i, spec in enumerate(specs):
        add_subscription(
            context,
            merchant_name=spec.merchant_name,
            amount=spec.amount,
            frequency=spec.frequency,
            months=months,
            category_primary=spec.category_primary,
            category_detailed=spec.category_detailed,
            account_key=account_key,
            seed=seed + i if seed else None,
        )

    return context


def add_fitness_bundle(
    context: TestContext,
    months: int = 6,
    subscriptions: list[SubscriptionSpec] | None = None,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    specs = subscriptions or FITNESS_SUBSCRIPTIONS

    for i, spec in enumerate(specs):
        add_subscription(
            context,
            merchant_name=spec.merchant_name,
            amount=spec.amount,
            frequency=spec.frequency,
            months=months,
            category_primary=spec.category_primary,
            category_detailed=spec.category_detailed,
            account_key=account_key,
            seed=seed + i if seed else None,
        )

    return context


def add_productivity_bundle(
    context: TestContext,
    months: int = 6,
    subscriptions: list[SubscriptionSpec] | None = None,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    specs = subscriptions or PRODUCTIVITY_SUBSCRIPTIONS

    for i, spec in enumerate(specs):
        add_subscription(
            context,
            merchant_name=spec.merchant_name,
            amount=spec.amount,
            frequency=spec.frequency,
            months=months,
            category_primary=spec.category_primary,
            category_detailed=spec.category_detailed,
            account_key=account_key,
            seed=seed + i if seed else None,
        )

    return context


def add_common_subscriptions_bundle(
    context: TestContext,
    months: int = 6,
    include_streaming: bool = True,
    include_utilities: bool = True,
    include_fitness: bool = False,
    include_productivity: bool = False,
    account_key: str | None = None,
    seed: int | None = None,
) -> TestContext:
    offset = 0

    if include_streaming:
        add_streaming_bundle(
            context,
            months=months,
            account_key=account_key,
            seed=seed + offset if seed else None,
        )
        offset += len(STREAMING_SUBSCRIPTIONS)

    if include_utilities:
        add_utilities_bundle(
            context,
            months=months,
            account_key=account_key,
            seed=seed + offset if seed else None,
        )
        offset += len(UTILITIES_SUBSCRIPTIONS)

    if include_fitness:
        add_fitness_bundle(
            context,
            months=months,
            account_key=account_key,
            seed=seed + offset if seed else None,
        )
        offset += len(FITNESS_SUBSCRIPTIONS)

    if include_productivity:
        add_productivity_bundle(
            context,
            months=months,
            account_key=account_key,
            seed=seed + offset if seed else None,
        )

    return context
