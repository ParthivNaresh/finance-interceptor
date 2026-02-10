from decimal import Decimal
from enum import Enum


class PriceSensitivity(str, Enum):
    STRICT = "strict"
    MODERATE = "moderate"
    FLEXIBLE = "flexible"


CATEGORY_SENSITIVITY_MAP: dict[str, PriceSensitivity] = {
    "ENTERTAINMENT": PriceSensitivity.STRICT,
    "GENERAL_SERVICES": PriceSensitivity.STRICT,
    "PERSONAL_CARE": PriceSensitivity.STRICT,
    "SUBSCRIPTION": PriceSensitivity.STRICT,
    "FOOD_AND_DRINK": PriceSensitivity.MODERATE,
    "TRANSPORTATION": PriceSensitivity.MODERATE,
    "MEDICAL": PriceSensitivity.MODERATE,
    "GENERAL_MERCHANDISE": PriceSensitivity.MODERATE,
    "GOVERNMENT_AND_NON_PROFIT": PriceSensitivity.MODERATE,
    "RENT_AND_UTILITIES": PriceSensitivity.FLEXIBLE,
    "HOME_IMPROVEMENT": PriceSensitivity.FLEXIBLE,
    "LOAN_PAYMENTS": PriceSensitivity.FLEXIBLE,
    "BANK_FEES": PriceSensitivity.FLEXIBLE,
}

SENSITIVITY_THRESHOLDS: dict[PriceSensitivity, Decimal] = {
    PriceSensitivity.STRICT: Decimal("0.01"),
    PriceSensitivity.MODERATE: Decimal("0.05"),
    PriceSensitivity.FLEXIBLE: Decimal("0.15"),
}


def get_price_sensitivity(category_primary: str | None) -> PriceSensitivity:
    if not category_primary:
        return PriceSensitivity.MODERATE
    return CATEGORY_SENSITIVITY_MAP.get(category_primary.upper(), PriceSensitivity.MODERATE)


def get_threshold_for_category(category_primary: str | None) -> Decimal:
    sensitivity = get_price_sensitivity(category_primary)
    return SENSITIVITY_THRESHOLDS[sensitivity]


def is_significant_change(
    previous_amount: Decimal,
    new_amount: Decimal,
    category_primary: str | None = None,
) -> bool:
    if previous_amount == Decimal("0"):
        return new_amount != Decimal("0")

    change_percentage = abs((new_amount - previous_amount) / previous_amount)
    threshold = get_threshold_for_category(category_primary)

    return change_percentage >= threshold


def calculate_change_percentage(
    previous_amount: Decimal,
    new_amount: Decimal,
) -> Decimal:
    if previous_amount == Decimal("0"):
        return Decimal("100") if new_amount > Decimal("0") else Decimal("0")

    return ((new_amount - previous_amount) / abs(previous_amount)) * Decimal("100")
