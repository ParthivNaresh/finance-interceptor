from enum import Enum


class StreamType(str, Enum):
    INFLOW = "inflow"
    OUTFLOW = "outflow"


class FrequencyType(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    SEMI_MONTHLY = "semi_monthly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUALLY = "semi_annually"
    ANNUALLY = "annually"
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


class StreamStatus(str, Enum):
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


class AlertType(str, Enum):
    PRICE_INCREASE = "price_increase"
    PRICE_DECREASE = "price_decrease"
    NEW_SUBSCRIPTION = "new_subscription"
    CANCELLED_SUBSCRIPTION = "cancelled_subscription"
    MISSED_PAYMENT = "missed_payment"


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AlertStatus(str, Enum):
    UNREAD = "unread"
    READ = "read"
    DISMISSED = "dismissed"
    ACTIONED = "actioned"


class UserActionType(str, Enum):
    DISMISSED = "dismissed"
    CANCELLED_SUBSCRIPTION = "cancelled_subscription"
    KEPT = "kept"
    WATCHING = "watching"
