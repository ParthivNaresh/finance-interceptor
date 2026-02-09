from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Literal


@dataclass
class MerchantInfo:
    name: str
    category_primary: str
    category_detailed: str
    logo_url: str | None = None
    website: str | None = None
    is_subscription: bool = False
    typical_amount_min: float = 5.0
    typical_amount_max: float = 100.0


CATEGORY_MERCHANTS: dict[str, list[MerchantInfo]] = {
    "FOOD_AND_DRINK": [
        MerchantInfo(
            name="Chipotle",
            category_primary="FOOD_AND_DRINK",
            category_detailed="FOOD_AND_DRINK_RESTAURANTS",
            website="chipotle.com",
            typical_amount_min=10.0,
            typical_amount_max=25.0,
        ),
        MerchantInfo(
            name="Starbucks",
            category_primary="FOOD_AND_DRINK",
            category_detailed="FOOD_AND_DRINK_COFFEE",
            website="starbucks.com",
            typical_amount_min=4.0,
            typical_amount_max=12.0,
        ),
        MerchantInfo(
            name="Whole Foods",
            category_primary="FOOD_AND_DRINK",
            category_detailed="FOOD_AND_DRINK_GROCERIES",
            website="wholefoodsmarket.com",
            typical_amount_min=30.0,
            typical_amount_max=200.0,
        ),
        MerchantInfo(
            name="Trader Joe's",
            category_primary="FOOD_AND_DRINK",
            category_detailed="FOOD_AND_DRINK_GROCERIES",
            website="traderjoes.com",
            typical_amount_min=25.0,
            typical_amount_max=150.0,
        ),
        MerchantInfo(
            name="DoorDash",
            category_primary="FOOD_AND_DRINK",
            category_detailed="FOOD_AND_DRINK_RESTAURANT_DELIVERY",
            website="doordash.com",
            typical_amount_min=15.0,
            typical_amount_max=50.0,
        ),
        MerchantInfo(
            name="Uber Eats",
            category_primary="FOOD_AND_DRINK",
            category_detailed="FOOD_AND_DRINK_RESTAURANT_DELIVERY",
            website="ubereats.com",
            typical_amount_min=15.0,
            typical_amount_max=50.0,
        ),
        MerchantInfo(
            name="McDonald's",
            category_primary="FOOD_AND_DRINK",
            category_detailed="FOOD_AND_DRINK_FAST_FOOD",
            website="mcdonalds.com",
            typical_amount_min=5.0,
            typical_amount_max=20.0,
        ),
        MerchantInfo(
            name="Sweetgreen",
            category_primary="FOOD_AND_DRINK",
            category_detailed="FOOD_AND_DRINK_RESTAURANTS",
            website="sweetgreen.com",
            typical_amount_min=12.0,
            typical_amount_max=20.0,
        ),
    ],
    "ENTERTAINMENT": [
        MerchantInfo(
            name="Netflix",
            category_primary="ENTERTAINMENT",
            category_detailed="ENTERTAINMENT_STREAMING",
            website="netflix.com",
            is_subscription=True,
            typical_amount_min=15.99,
            typical_amount_max=22.99,
        ),
        MerchantInfo(
            name="Spotify",
            category_primary="ENTERTAINMENT",
            category_detailed="ENTERTAINMENT_STREAMING",
            website="spotify.com",
            is_subscription=True,
            typical_amount_min=10.99,
            typical_amount_max=16.99,
        ),
        MerchantInfo(
            name="Disney+",
            category_primary="ENTERTAINMENT",
            category_detailed="ENTERTAINMENT_STREAMING",
            website="disneyplus.com",
            is_subscription=True,
            typical_amount_min=7.99,
            typical_amount_max=13.99,
        ),
        MerchantInfo(
            name="AMC Theatres",
            category_primary="ENTERTAINMENT",
            category_detailed="ENTERTAINMENT_MOVIES",
            website="amctheatres.com",
            typical_amount_min=12.0,
            typical_amount_max=40.0,
        ),
        MerchantInfo(
            name="PlayStation Store",
            category_primary="ENTERTAINMENT",
            category_detailed="ENTERTAINMENT_GAMES",
            website="playstation.com",
            typical_amount_min=9.99,
            typical_amount_max=69.99,
        ),
        MerchantInfo(
            name="Steam",
            category_primary="ENTERTAINMENT",
            category_detailed="ENTERTAINMENT_GAMES",
            website="steampowered.com",
            typical_amount_min=4.99,
            typical_amount_max=59.99,
        ),
        MerchantInfo(
            name="YouTube Premium",
            category_primary="ENTERTAINMENT",
            category_detailed="ENTERTAINMENT_STREAMING",
            website="youtube.com",
            is_subscription=True,
            typical_amount_min=13.99,
            typical_amount_max=22.99,
        ),
    ],
    "GENERAL_MERCHANDISE": [
        MerchantInfo(
            name="Amazon",
            category_primary="GENERAL_MERCHANDISE",
            category_detailed="GENERAL_MERCHANDISE_ONLINE_MARKETPLACES",
            website="amazon.com",
            typical_amount_min=10.0,
            typical_amount_max=200.0,
        ),
        MerchantInfo(
            name="Target",
            category_primary="GENERAL_MERCHANDISE",
            category_detailed="GENERAL_MERCHANDISE_SUPERSTORES",
            website="target.com",
            typical_amount_min=15.0,
            typical_amount_max=150.0,
        ),
        MerchantInfo(
            name="Walmart",
            category_primary="GENERAL_MERCHANDISE",
            category_detailed="GENERAL_MERCHANDISE_SUPERSTORES",
            website="walmart.com",
            typical_amount_min=10.0,
            typical_amount_max=200.0,
        ),
        MerchantInfo(
            name="Best Buy",
            category_primary="GENERAL_MERCHANDISE",
            category_detailed="GENERAL_MERCHANDISE_ELECTRONICS",
            website="bestbuy.com",
            typical_amount_min=20.0,
            typical_amount_max=500.0,
        ),
        MerchantInfo(
            name="Apple Store",
            category_primary="GENERAL_MERCHANDISE",
            category_detailed="GENERAL_MERCHANDISE_ELECTRONICS",
            website="apple.com",
            typical_amount_min=29.0,
            typical_amount_max=1500.0,
        ),
        MerchantInfo(
            name="IKEA",
            category_primary="GENERAL_MERCHANDISE",
            category_detailed="GENERAL_MERCHANDISE_FURNITURE",
            website="ikea.com",
            typical_amount_min=20.0,
            typical_amount_max=500.0,
        ),
    ],
    "PERSONAL_CARE": [
        MerchantInfo(
            name="CVS Pharmacy",
            category_primary="PERSONAL_CARE",
            category_detailed="PERSONAL_CARE_PHARMACIES",
            website="cvs.com",
            typical_amount_min=10.0,
            typical_amount_max=80.0,
        ),
        MerchantInfo(
            name="Walgreens",
            category_primary="PERSONAL_CARE",
            category_detailed="PERSONAL_CARE_PHARMACIES",
            website="walgreens.com",
            typical_amount_min=10.0,
            typical_amount_max=80.0,
        ),
        MerchantInfo(
            name="Sephora",
            category_primary="PERSONAL_CARE",
            category_detailed="PERSONAL_CARE_COSMETICS",
            website="sephora.com",
            typical_amount_min=20.0,
            typical_amount_max=150.0,
        ),
        MerchantInfo(
            name="Great Clips",
            category_primary="PERSONAL_CARE",
            category_detailed="PERSONAL_CARE_HAIR_SALONS",
            website="greatclips.com",
            typical_amount_min=15.0,
            typical_amount_max=40.0,
        ),
        MerchantInfo(
            name="Planet Fitness",
            category_primary="PERSONAL_CARE",
            category_detailed="PERSONAL_CARE_GYMS",
            website="planetfitness.com",
            is_subscription=True,
            typical_amount_min=10.0,
            typical_amount_max=24.99,
        ),
        MerchantInfo(
            name="Equinox",
            category_primary="PERSONAL_CARE",
            category_detailed="PERSONAL_CARE_GYMS",
            website="equinox.com",
            is_subscription=True,
            typical_amount_min=200.0,
            typical_amount_max=350.0,
        ),
    ],
    "TRAVEL": [
        MerchantInfo(
            name="United Airlines",
            category_primary="TRAVEL",
            category_detailed="TRAVEL_FLIGHTS",
            website="united.com",
            typical_amount_min=150.0,
            typical_amount_max=800.0,
        ),
        MerchantInfo(
            name="Delta Airlines",
            category_primary="TRAVEL",
            category_detailed="TRAVEL_FLIGHTS",
            website="delta.com",
            typical_amount_min=150.0,
            typical_amount_max=800.0,
        ),
        MerchantInfo(
            name="Marriott",
            category_primary="TRAVEL",
            category_detailed="TRAVEL_LODGING",
            website="marriott.com",
            typical_amount_min=100.0,
            typical_amount_max=400.0,
        ),
        MerchantInfo(
            name="Airbnb",
            category_primary="TRAVEL",
            category_detailed="TRAVEL_LODGING",
            website="airbnb.com",
            typical_amount_min=80.0,
            typical_amount_max=500.0,
        ),
        MerchantInfo(
            name="Uber",
            category_primary="TRAVEL",
            category_detailed="TRAVEL_RIDESHARE",
            website="uber.com",
            typical_amount_min=8.0,
            typical_amount_max=50.0,
        ),
        MerchantInfo(
            name="Lyft",
            category_primary="TRAVEL",
            category_detailed="TRAVEL_RIDESHARE",
            website="lyft.com",
            typical_amount_min=8.0,
            typical_amount_max=50.0,
        ),
    ],
    "GENERAL_SERVICES": [
        MerchantInfo(
            name="AT&T",
            category_primary="GENERAL_SERVICES",
            category_detailed="GENERAL_SERVICES_TELECOMMUNICATION",
            website="att.com",
            is_subscription=True,
            typical_amount_min=50.0,
            typical_amount_max=150.0,
        ),
        MerchantInfo(
            name="Verizon",
            category_primary="GENERAL_SERVICES",
            category_detailed="GENERAL_SERVICES_TELECOMMUNICATION",
            website="verizon.com",
            is_subscription=True,
            typical_amount_min=50.0,
            typical_amount_max=150.0,
        ),
        MerchantInfo(
            name="Comcast",
            category_primary="GENERAL_SERVICES",
            category_detailed="GENERAL_SERVICES_CABLE",
            website="xfinity.com",
            is_subscription=True,
            typical_amount_min=60.0,
            typical_amount_max=200.0,
        ),
        MerchantInfo(
            name="State Farm",
            category_primary="GENERAL_SERVICES",
            category_detailed="GENERAL_SERVICES_INSURANCE",
            website="statefarm.com",
            is_subscription=True,
            typical_amount_min=80.0,
            typical_amount_max=300.0,
        ),
    ],
    "RENT_AND_UTILITIES": [
        MerchantInfo(
            name="Avalon Communities",
            category_primary="RENT_AND_UTILITIES",
            category_detailed="RENT_AND_UTILITIES_RENT",
            website="avaloncommunities.com",
            is_subscription=True,
            typical_amount_min=1500.0,
            typical_amount_max=3500.0,
        ),
        MerchantInfo(
            name="Con Edison",
            category_primary="RENT_AND_UTILITIES",
            category_detailed="RENT_AND_UTILITIES_ELECTRIC",
            website="coned.com",
            is_subscription=True,
            typical_amount_min=50.0,
            typical_amount_max=200.0,
        ),
        MerchantInfo(
            name="National Grid",
            category_primary="RENT_AND_UTILITIES",
            category_detailed="RENT_AND_UTILITIES_GAS",
            website="nationalgrid.com",
            is_subscription=True,
            typical_amount_min=30.0,
            typical_amount_max=150.0,
        ),
    ],
    "INCOME": [
        MerchantInfo(
            name="ACME Corp Payroll",
            category_primary="INCOME",
            category_detailed="INCOME_WAGES",
            typical_amount_min=2000.0,
            typical_amount_max=10000.0,
        ),
        MerchantInfo(
            name="Direct Deposit - Employer",
            category_primary="INCOME",
            category_detailed="INCOME_WAGES",
            typical_amount_min=2000.0,
            typical_amount_max=10000.0,
        ),
        MerchantInfo(
            name="Venmo",
            category_primary="INCOME",
            category_detailed="INCOME_OTHER",
            website="venmo.com",
            typical_amount_min=10.0,
            typical_amount_max=500.0,
        ),
    ],
    "TRANSFER_IN": [
        MerchantInfo(
            name="Transfer from Savings",
            category_primary="TRANSFER_IN",
            category_detailed="TRANSFER_IN_ACCOUNT_TRANSFER",
            typical_amount_min=100.0,
            typical_amount_max=5000.0,
        ),
        MerchantInfo(
            name="Zelle Transfer",
            category_primary="TRANSFER_IN",
            category_detailed="TRANSFER_IN_ACCOUNT_TRANSFER",
            typical_amount_min=50.0,
            typical_amount_max=2000.0,
        ),
    ],
    "TRANSFER_OUT": [
        MerchantInfo(
            name="Transfer to Savings",
            category_primary="TRANSFER_OUT",
            category_detailed="TRANSFER_OUT_ACCOUNT_TRANSFER",
            typical_amount_min=100.0,
            typical_amount_max=5000.0,
        ),
        MerchantInfo(
            name="Zelle Payment",
            category_primary="TRANSFER_OUT",
            category_detailed="TRANSFER_OUT_ACCOUNT_TRANSFER",
            typical_amount_min=50.0,
            typical_amount_max=2000.0,
        ),
    ],
}


def get_merchant_for_category(
    category_primary: str,
    seed: int | None = None,
) -> MerchantInfo:
    merchants = CATEGORY_MERCHANTS.get(category_primary, [])
    if not merchants:
        return MerchantInfo(
            name=f"Generic {category_primary} Merchant",
            category_primary=category_primary,
            category_detailed=f"{category_primary}_OTHER",
        )

    rng = random.Random(seed)
    return rng.choice(merchants)


def get_merchants_for_category(
    category_primary: str,
    count: int,
    seed: int | None = None,
) -> list[MerchantInfo]:
    merchants = CATEGORY_MERCHANTS.get(category_primary, [])
    if not merchants:
        return [
            MerchantInfo(
                name=f"Generic {category_primary} Merchant {i}",
                category_primary=category_primary,
                category_detailed=f"{category_primary}_OTHER",
            )
            for i in range(count)
        ]

    rng = random.Random(seed)

    if count <= len(merchants):
        return rng.sample(merchants, count)

    result = merchants.copy()
    while len(result) < count:
        result.append(rng.choice(merchants))
    return result[:count]


def get_random_merchant(seed: int | None = None) -> MerchantInfo:
    rng = random.Random(seed)
    category = rng.choice(list(CATEGORY_MERCHANTS.keys()))
    return get_merchant_for_category(category, seed)


def get_subscription_merchants() -> list[MerchantInfo]:
    subscriptions: list[MerchantInfo] = []
    for merchants in CATEGORY_MERCHANTS.values():
        for merchant in merchants:
            if merchant.is_subscription:
                subscriptions.append(merchant)
    return subscriptions


def get_merchant_by_name(name: str) -> MerchantInfo | None:
    for merchants in CATEGORY_MERCHANTS.values():
        for merchant in merchants:
            if merchant.name.lower() == name.lower():
                return merchant
    return None
