from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID

from models.enums import FrequencyType, IncomeSourceType

if TYPE_CHECKING:
    from repositories.transaction import TransactionRepository

CONFIDENCE_THRESHOLD_AUTO_INCLUDE = Decimal("0.80")

SALARY_PATTERNS: tuple[str, ...] = (
    "payroll",
    "direct dep",
    "direct deposit",
    "salary",
    "wages",
    "paycheck",
    "ach credit",
)

FREELANCE_PATTERNS: tuple[str, ...] = (
    "invoice",
    "consulting",
    "freelance",
    "contract",
    "1099",
)

INVESTMENT_PATTERNS: tuple[str, ...] = (
    "dividend",
    "interest",
    "capital gain",
    "investment",
    "brokerage",
    "fidelity",
    "vanguard",
    "schwab",
    "etrade",
)

REFUND_PATTERNS: tuple[str, ...] = (
    "refund",
    "return",
    "credit",
    "reimbursement",
    "cashback",
)

TRANSFER_PATTERNS: tuple[str, ...] = (
    "transfer",
    "xfer",
    "zelle",
    "venmo",
    "paypal",
)


@dataclass
class IncomeTransaction:
    transaction_id: UUID
    amount: Decimal
    transaction_date: date
    source_name: str
    account_id: UUID | None


@dataclass
class DetectedIncomeSource:
    source_name: str
    source_type: IncomeSourceType
    frequency: FrequencyType
    average_amount: Decimal
    last_amount: Decimal
    first_date: date
    last_date: date
    next_expected_date: date | None
    transaction_count: int
    confidence_score: Decimal
    account_id: UUID | None
    transactions: list[IncomeTransaction] = field(default_factory=list)

    @property
    def is_high_confidence(self) -> bool:
        return self.confidence_score >= CONFIDENCE_THRESHOLD_AUTO_INCLUDE


@dataclass
class IncomeDetectionResult:
    sources: list[DetectedIncomeSource]
    total_sources: int
    high_confidence_count: int
    transactions_analyzed: int


class IncomeDetector:
    MIN_TRANSACTIONS_FOR_DETECTION = 2
    MIN_AMOUNT_THRESHOLD = Decimal("50.00")

    def __init__(self, transaction_repo: TransactionRepository) -> None:
        self._transaction_repo = transaction_repo

    def detect_income_sources(self, user_id: UUID) -> IncomeDetectionResult:
        transactions = self._fetch_income_transactions(user_id)

        if not transactions:
            return IncomeDetectionResult(
                sources=[],
                total_sources=0,
                high_confidence_count=0,
                transactions_analyzed=0,
            )

        grouped = self._group_by_source(transactions)
        sources = self._analyze_sources(grouped)

        high_confidence = sum(1 for s in sources if s.is_high_confidence)

        return IncomeDetectionResult(
            sources=sources,
            total_sources=len(sources),
            high_confidence_count=high_confidence,
            transactions_analyzed=len(transactions),
        )

    def _fetch_income_transactions(self, user_id: UUID) -> list[IncomeTransaction]:
        raw_transactions, _ = self._transaction_repo.get_by_user_id(
            user_id=user_id,
            pending=False,
            limit=100000,
            offset=0,
        )

        income_transactions: list[IncomeTransaction] = []

        for txn in raw_transactions:
            amount = Decimal(str(txn.get("amount", 0)))

            if amount >= 0:
                continue

            abs_amount = abs(amount)
            if abs_amount < self.MIN_AMOUNT_THRESHOLD:
                continue

            if self._is_internal_transfer(txn):
                continue

            txn_date = self._parse_date(txn.get("date"))
            if txn_date is None:
                continue

            source_name = self._extract_source_name(txn)
            txn_id = UUID(txn["id"]) if isinstance(txn.get("id"), str) else txn.get("id")
            account_id = self._parse_uuid(txn.get("account_id"))

            income_transactions.append(
                IncomeTransaction(
                    transaction_id=txn_id,
                    amount=abs_amount,
                    transaction_date=txn_date,
                    source_name=source_name,
                    account_id=account_id,
                )
            )

        return income_transactions

    def _group_by_source(
        self,
        transactions: list[IncomeTransaction],
    ) -> dict[str, list[IncomeTransaction]]:
        grouped: dict[str, list[IncomeTransaction]] = defaultdict(list)

        for txn in transactions:
            normalized_name = self._normalize_source_name(txn.source_name)
            grouped[normalized_name].append(txn)

        return dict(grouped)

    def _analyze_sources(
        self,
        grouped: dict[str, list[IncomeTransaction]],
    ) -> list[DetectedIncomeSource]:
        sources: list[DetectedIncomeSource] = []

        for source_name, transactions in grouped.items():
            if len(transactions) < self.MIN_TRANSACTIONS_FOR_DETECTION:
                continue

            source = self._analyze_single_source(source_name, transactions)
            sources.append(source)

        sources.sort(key=lambda s: s.average_amount, reverse=True)

        return sources

    def _analyze_single_source(
        self,
        source_name: str,
        transactions: list[IncomeTransaction],
    ) -> DetectedIncomeSource:
        sorted_txns = sorted(transactions, key=lambda t: t.transaction_date)

        amounts = [t.amount for t in sorted_txns]
        dates = [t.transaction_date for t in sorted_txns]

        average_amount = sum(amounts) / len(amounts)
        last_amount = amounts[-1]
        first_date = dates[0]
        last_date = dates[-1]

        frequency = self._detect_frequency(dates)
        source_type = self._classify_source_type(source_name)
        confidence = self._calculate_confidence(amounts, dates, source_type)
        next_expected = self._predict_next_date(last_date, frequency)

        account_id = sorted_txns[-1].account_id

        return DetectedIncomeSource(
            source_name=source_name,
            source_type=source_type,
            frequency=frequency,
            average_amount=average_amount,
            last_amount=last_amount,
            first_date=first_date,
            last_date=last_date,
            next_expected_date=next_expected,
            transaction_count=len(transactions),
            confidence_score=confidence,
            account_id=account_id,
            transactions=sorted_txns,
        )

    def _detect_frequency(self, dates: list[date]) -> FrequencyType:
        if len(dates) < 2:
            return FrequencyType.UNKNOWN

        deltas = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]
        avg_days = sum(deltas) / len(deltas)

        frequency_thresholds: tuple[tuple[int, FrequencyType], ...] = (
            (9, FrequencyType.WEEKLY),
            (18, FrequencyType.BIWEEKLY),
            (35, FrequencyType.MONTHLY),
            (100, FrequencyType.QUARTERLY),
            (200, FrequencyType.SEMI_ANNUALLY),
            (400, FrequencyType.ANNUALLY),
        )

        for threshold, frequency in frequency_thresholds:
            if avg_days <= threshold:
                return frequency

        return FrequencyType.IRREGULAR

    def _classify_source_type(self, source_name: str) -> IncomeSourceType:
        name_lower = source_name.lower()

        for pattern in SALARY_PATTERNS:
            if pattern in name_lower:
                return IncomeSourceType.SALARY

        for pattern in FREELANCE_PATTERNS:
            if pattern in name_lower:
                return IncomeSourceType.FREELANCE

        for pattern in INVESTMENT_PATTERNS:
            if pattern in name_lower:
                return IncomeSourceType.INVESTMENT

        for pattern in REFUND_PATTERNS:
            if pattern in name_lower:
                return IncomeSourceType.REFUND

        for pattern in TRANSFER_PATTERNS:
            if pattern in name_lower:
                return IncomeSourceType.TRANSFER

        return IncomeSourceType.OTHER

    def _calculate_confidence(
        self,
        amounts: list[Decimal],
        dates: list[date],
        source_type: IncomeSourceType,
    ) -> Decimal:
        amount_consistency = self._calculate_amount_consistency(amounts)
        timing_regularity = self._calculate_timing_regularity(dates)
        type_bonus = self._get_type_confidence_bonus(source_type)
        frequency_bonus = self._get_frequency_bonus(len(dates))

        raw_score = (
            amount_consistency * Decimal("0.35")
            + timing_regularity * Decimal("0.35")
            + type_bonus * Decimal("0.20")
            + frequency_bonus * Decimal("0.10")
        )

        return min(Decimal("1.00"), max(Decimal("0.00"), raw_score))

    def _calculate_amount_consistency(self, amounts: list[Decimal]) -> Decimal:
        if len(amounts) < 2:
            return Decimal("0.50")

        avg = sum(amounts) / len(amounts)
        if avg == 0:
            return Decimal("0.00")

        deviations = [abs(a - avg) / avg for a in amounts]
        avg_deviation = sum(deviations) / len(deviations)

        consistency = Decimal("1.00") - min(Decimal("1.00"), avg_deviation)
        return consistency

    def _calculate_timing_regularity(self, dates: list[date]) -> Decimal:
        if len(dates) < 3:
            return Decimal("0.50")

        deltas = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]

        avg_delta = sum(deltas) / len(deltas)
        if avg_delta == 0:
            return Decimal("0.00")

        deviations = [abs(d - avg_delta) / avg_delta for d in deltas]
        avg_deviation = sum(deviations) / len(deviations)

        regularity = Decimal("1.00") - min(Decimal("1.00"), Decimal(str(avg_deviation)))
        return regularity

    def _get_type_confidence_bonus(self, source_type: IncomeSourceType) -> Decimal:
        bonuses = {
            IncomeSourceType.SALARY: Decimal("1.00"),
            IncomeSourceType.FREELANCE: Decimal("0.70"),
            IncomeSourceType.INVESTMENT: Decimal("0.60"),
            IncomeSourceType.REFUND: Decimal("0.20"),
            IncomeSourceType.TRANSFER: Decimal("0.10"),
            IncomeSourceType.OTHER: Decimal("0.40"),
        }
        return bonuses.get(source_type, Decimal("0.40"))

    def _get_frequency_bonus(self, transaction_count: int) -> Decimal:
        if transaction_count >= 12:
            return Decimal("1.00")
        if transaction_count >= 6:
            return Decimal("0.80")
        if transaction_count >= 3:
            return Decimal("0.60")
        return Decimal("0.40")

    def _predict_next_date(
        self,
        last_date: date,
        frequency: FrequencyType,
    ) -> date | None:
        from datetime import timedelta

        days_map = {
            FrequencyType.WEEKLY: 7,
            FrequencyType.BIWEEKLY: 14,
            FrequencyType.MONTHLY: 30,
            FrequencyType.QUARTERLY: 91,
            FrequencyType.SEMI_ANNUALLY: 182,
            FrequencyType.ANNUALLY: 365,
        }

        days = days_map.get(frequency)
        if days is None:
            return None

        return last_date + timedelta(days=days)

    def _is_internal_transfer(self, txn: dict[str, Any]) -> bool:
        category_primary = txn.get("personal_finance_category_primary", "")
        transfer_categories = ("TRANSFER_IN", "TRANSFER_OUT")
        return bool(category_primary and category_primary.upper() in transfer_categories)

    def _extract_source_name(self, txn: dict[str, Any]) -> str:
        return txn.get("merchant_name") or txn.get("name") or "Unknown Source"

    def _normalize_source_name(self, name: str) -> str:
        normalized = name.upper().strip()
        normalized = re.sub(r"\s+", " ", normalized)
        normalized = re.sub(r"[#*]+\d+", "", normalized)
        normalized = re.sub(r"\d{4,}", "", normalized)
        return normalized.strip()

    @staticmethod
    def _parse_date(value: Any) -> date | None:
        if value is None:
            return None
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return date.fromisoformat(value[:10])
            except ValueError:
                return None
        return None

    @staticmethod
    def _parse_uuid(value: Any) -> UUID | None:
        if value is None:
            return None
        if isinstance(value, UUID):
            return value
        if isinstance(value, str):
            try:
                return UUID(value)
            except ValueError:
                return None
        return None


class IncomeDetectorContainer:
    _instance: IncomeDetector | None = None

    @classmethod
    def get(cls) -> IncomeDetector:
        if cls._instance is None:
            from repositories.transaction import get_transaction_repository

            cls._instance = IncomeDetector(
                transaction_repo=get_transaction_repository(),
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_income_detector() -> IncomeDetector:
    return IncomeDetectorContainer.get()
