from __future__ import annotations

import random
from decimal import ROUND_HALF_UP, Decimal


def round_to_cents(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def generate_amount_with_variance(
    target: Decimal,
    variance_pct: float = 0.15,
    min_amount: Decimal | None = None,
    max_amount: Decimal | None = None,
    seed: int | None = None,
) -> Decimal:
    rng = random.Random(seed)

    variance_factor = 1 + rng.uniform(-variance_pct, variance_pct)
    amount = target * Decimal(str(variance_factor))

    if min_amount is not None:
        amount = max(amount, min_amount)
    if max_amount is not None:
        amount = min(amount, max_amount)

    return round_to_cents(amount)


def generate_amounts_with_variance(
    target_total: Decimal,
    count: int,
    variance_pct: float = 0.15,
    min_amount: Decimal | None = None,
    max_amount: Decimal | None = None,
    seed: int | None = None,
) -> list[Decimal]:
    if count <= 0:
        return []

    if count == 1:
        return [round_to_cents(target_total)]

    rng = random.Random(seed)
    base_amount = target_total / count

    effective_min = min_amount or Decimal("0.01")
    effective_max = max_amount or (base_amount * Decimal("3"))

    amounts: list[Decimal] = []
    for _ in range(count - 1):
        variance_factor = 1 + rng.uniform(-variance_pct, variance_pct)
        amount = base_amount * Decimal(str(variance_factor))
        amount = max(effective_min, min(effective_max, amount))
        amounts.append(round_to_cents(amount))

    current_total = sum(amounts)
    final_amount = target_total - current_total
    final_amount = max(effective_min, min(effective_max, final_amount))
    amounts.append(round_to_cents(final_amount))

    rng.shuffle(amounts)
    return amounts


def distribute_amount(
    total: Decimal,
    count: int,
    distribution: str = "uniform",
    seed: int | None = None,
) -> list[Decimal]:
    if count <= 0:
        return []

    if count == 1:
        return [round_to_cents(total)]

    rng = random.Random(seed)

    if distribution == "uniform":
        base = total / count
        amounts = [round_to_cents(base) for _ in range(count)]
        diff = total - sum(amounts)
        amounts[-1] = round_to_cents(amounts[-1] + diff)
        return amounts

    elif distribution == "weighted":
        weights = [rng.random() for _ in range(count)]
        total_weight = sum(weights)
        amounts = [round_to_cents(total * Decimal(str(w / total_weight))) for w in weights]
        diff = total - sum(amounts)
        amounts[-1] = round_to_cents(amounts[-1] + diff)
        return amounts

    elif distribution == "pareto":
        weights = [(i + 1) ** -1.5 for i in range(count)]
        total_weight = sum(weights)
        amounts = [round_to_cents(total * Decimal(str(w / total_weight))) for w in weights]
        diff = total - sum(amounts)
        amounts[-1] = round_to_cents(amounts[-1] + diff)
        rng.shuffle(amounts)
        return amounts

    else:
        raise ValueError(f"Unknown distribution: {distribution}")


def generate_increasing_amounts(
    start_amount: Decimal,
    end_amount: Decimal,
    count: int,
    noise_pct: float = 0.05,
    seed: int | None = None,
) -> list[Decimal]:
    if count <= 0:
        return []

    if count == 1:
        return [round_to_cents(start_amount)]

    rng = random.Random(seed)
    step = (end_amount - start_amount) / (count - 1)

    amounts: list[Decimal] = []
    for i in range(count):
        base = start_amount + (step * i)
        if noise_pct > 0:
            noise = Decimal(str(rng.uniform(-noise_pct, noise_pct)))
            base = base * (1 + noise)
        amounts.append(round_to_cents(base))

    return amounts


def generate_subscription_amounts(
    base_amount: Decimal,
    count: int,
    price_change_at: int | None = None,
    new_amount: Decimal | None = None,
) -> list[Decimal]:
    if count <= 0:
        return []

    amounts: list[Decimal] = []
    current_amount = round_to_cents(base_amount)

    for i in range(count):
        if price_change_at is not None and i >= price_change_at and new_amount is not None:
            current_amount = round_to_cents(new_amount)
        amounts.append(current_amount)

    return amounts
