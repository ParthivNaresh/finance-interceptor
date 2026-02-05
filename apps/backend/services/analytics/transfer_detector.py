from __future__ import annotations

from typing import Any


class TransferDetector:
    TRANSFER_CATEGORIES: frozenset[str] = frozenset({
        "TRANSFER_IN",
        "TRANSFER_OUT",
        "TRANSFER_IN_ACCOUNT_TRANSFER",
        "TRANSFER_OUT_ACCOUNT_TRANSFER",
        "TRANSFER_IN_INTERNAL_ACCOUNT_TRANSFER",
        "TRANSFER_OUT_INTERNAL_ACCOUNT_TRANSFER",
        "BANK_FEES_ATM_FEES",
    })

    TRANSFER_PRIMARY_CATEGORIES: frozenset[str] = frozenset({
        "TRANSFER_IN",
        "TRANSFER_OUT",
    })

    TRANSFER_NAME_PATTERNS: tuple[str, ...] = (
        "transfer",
        "xfer",
        "internal",
        "zelle",
        "venmo",
        "paypal",
    )

    def is_internal_transfer(self, transaction: dict[str, Any]) -> bool:
        category_primary = transaction.get("personal_finance_category_primary", "")
        category_detailed = transaction.get("personal_finance_category_detailed", "")

        if category_primary and category_primary.upper() in self.TRANSFER_PRIMARY_CATEGORIES:
            return True

        if category_detailed and category_detailed.upper() in self.TRANSFER_CATEGORIES:
            return True

        return False

    def is_likely_transfer(self, transaction: dict[str, Any]) -> bool:
        if self.is_internal_transfer(transaction):
            return True

        name = (transaction.get("name") or "").lower()
        merchant = (transaction.get("merchant_name") or "").lower()

        for pattern in self.TRANSFER_NAME_PATTERNS:
            if pattern in name or pattern in merchant:
                return True

        return False

    def mark_transfers(
        self,
        transactions: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        for txn in transactions:
            txn["is_internal_transfer"] = self.is_internal_transfer(txn)
        return transactions

    def filter_non_transfers(
        self,
        transactions: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        return [
            txn for txn in transactions
            if not self.is_internal_transfer(txn)
        ]

    def partition_by_transfer(
        self,
        transactions: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        transfers: list[dict[str, Any]] = []
        non_transfers: list[dict[str, Any]] = []

        for txn in transactions:
            if self.is_internal_transfer(txn):
                transfers.append(txn)
            else:
                non_transfers.append(txn)

        return transfers, non_transfers


class TransferDetectorContainer:
    _instance: TransferDetector | None = None

    @classmethod
    def get(cls) -> TransferDetector:
        if cls._instance is None:
            cls._instance = TransferDetector()
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_transfer_detector() -> TransferDetector:
    return TransferDetectorContainer.get()
