from enum import StrEnum


class StreamType(StrEnum):
    INFLOW = "inflow"
    OUTFLOW = "outflow"


class FrequencyType(StrEnum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    SEMI_MONTHLY = "semi_monthly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUALLY = "semi_annually"
    ANNUALLY = "annually"
    IRREGULAR = "irregular"
    UNKNOWN = "unknown"

    @classmethod
    def from_plaid(cls, plaid_frequency: str) -> "FrequencyType":
        mapping = {
            "WEEKLY": cls.WEEKLY,
            "BIWEEKLY": cls.BIWEEKLY,
            "SEMI_MONTHLY": cls.SEMI_MONTHLY,
            "MONTHLY": cls.MONTHLY,
            "QUARTERLY": cls.QUARTERLY,
            "SEMI_ANNUALLY": cls.SEMI_ANNUALLY,
            "ANNUALLY": cls.ANNUALLY,
        }
        return mapping.get(plaid_frequency.upper(), cls.UNKNOWN)


class StreamStatus(StrEnum):
    MATURE = "mature"
    EARLY_DETECTION = "early_detection"
    TOMBSTONED = "tombstoned"

    @classmethod
    def from_plaid(cls, plaid_status: str) -> "StreamStatus":
        mapping = {
            "MATURE": cls.MATURE,
            "EARLY_DETECTION": cls.EARLY_DETECTION,
            "TOMBSTONED": cls.TOMBSTONED,
        }
        return mapping.get(plaid_status.upper(), cls.MATURE)


class AlertType(StrEnum):
    PRICE_INCREASE = "price_increase"
    PRICE_DECREASE = "price_decrease"
    NEW_SUBSCRIPTION = "new_subscription"
    CANCELLED_SUBSCRIPTION = "cancelled_subscription"
    MISSED_PAYMENT = "missed_payment"


class AlertSeverity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AlertStatus(StrEnum):
    UNREAD = "unread"
    READ = "read"
    DISMISSED = "dismissed"
    ACTIONED = "actioned"


class UserActionType(StrEnum):
    DISMISSED = "dismissed"
    CANCELLED_SUBSCRIPTION = "cancelled_subscription"
    KEPT = "kept"
    WATCHING = "watching"


class PeriodType(StrEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class BaselineType(StrEnum):
    ROLLING_3MO = "rolling_3mo"
    ROLLING_6MO = "rolling_6mo"
    ROLLING_12MO = "rolling_12mo"
    SEASONAL = "seasonal"


class AnomalyType(StrEnum):
    LARGE_AMOUNT = "large_amount"
    NEW_MERCHANT = "new_merchant"
    CATEGORY_SPIKE = "category_spike"
    DUPLICATE = "duplicate"
    UNUSUAL_TIME = "unusual_time"
    UNUSUAL_LOCATION = "unusual_location"


class AnomalyContext(StrEnum):
    SUBSCRIPTION_PRICE_CHANGE = "subscription_price_change"
    DISCRETIONARY_SPIKE = "discretionary_spike"
    NEW_VENDOR = "new_vendor"
    DUPLICATE_CHARGE = "duplicate_charge"
    UNUSUAL_TIMING = "unusual_timing"


class IncomeSourceType(StrEnum):
    SALARY = "salary"
    FREELANCE = "freelance"
    INVESTMENT = "investment"
    TRANSFER = "transfer"
    REFUND = "refund"
    OTHER = "other"


class ComputationStatus(StrEnum):
    SUCCESS = "success"
    FAILED = "failed"
    IN_PROGRESS = "in_progress"


class CreepSeverity(StrEnum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

    @classmethod
    def from_percentage(cls, percentage: float) -> "CreepSeverity":
        if percentage < 10.0:
            return cls.NONE
        if percentage < 25.0:
            return cls.LOW
        if percentage < 50.0:
            return cls.MEDIUM
        return cls.HIGH


class SpendingCategory(StrEnum):
    INCOME = "INCOME"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
    LOAN_PAYMENTS = "LOAN_PAYMENTS"
    BANK_FEES = "BANK_FEES"
    ENTERTAINMENT = "ENTERTAINMENT"
    FOOD_AND_DRINK = "FOOD_AND_DRINK"
    GENERAL_MERCHANDISE = "GENERAL_MERCHANDISE"
    HOME_IMPROVEMENT = "HOME_IMPROVEMENT"
    MEDICAL = "MEDICAL"
    PERSONAL_CARE = "PERSONAL_CARE"
    GENERAL_SERVICES = "GENERAL_SERVICES"
    GOVERNMENT_AND_NON_PROFIT = "GOVERNMENT_AND_NON_PROFIT"
    TRANSPORTATION = "TRANSPORTATION"
    TRAVEL = "TRAVEL"
    RENT_AND_UTILITIES = "RENT_AND_UTILITIES"

    @classmethod
    def discretionary_categories(cls) -> frozenset["SpendingCategory"]:
        return frozenset(
            {
                cls.ENTERTAINMENT,
                cls.FOOD_AND_DRINK,
                cls.GENERAL_MERCHANDISE,
                cls.PERSONAL_CARE,
                cls.GENERAL_SERVICES,
                cls.TRAVEL,
            }
        )

    @classmethod
    def non_discretionary_categories(cls) -> frozenset["SpendingCategory"]:
        return frozenset(
            {
                cls.INCOME,
                cls.TRANSFER_IN,
                cls.TRANSFER_OUT,
                cls.LOAN_PAYMENTS,
                cls.BANK_FEES,
                cls.RENT_AND_UTILITIES,
                cls.TRANSPORTATION,
                cls.MEDICAL,
                cls.HOME_IMPROVEMENT,
                cls.GOVERNMENT_AND_NON_PROFIT,
            }
        )

    @classmethod
    def is_discretionary(cls, category: str) -> bool:
        try:
            cat = cls(category)
            return cat in cls.discretionary_categories()
        except ValueError:
            return True
