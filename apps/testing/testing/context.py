from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID


@dataclass
class CreatedTransaction:
    id: UUID
    transaction_id: str
    account_id: UUID
    amount: Decimal
    date: date
    merchant_name: str | None
    category_primary: str | None
    category_detailed: str | None


@dataclass
class CreatedAccount:
    id: UUID
    account_id: str
    plaid_item_id: UUID
    name: str
    type: str
    subtype: str | None
    current_balance: Decimal


@dataclass
class CreatedPlaidItem:
    id: UUID
    item_id: str
    user_id: UUID
    institution_name: str


@dataclass
class CreatedRecurringStream:
    id: UUID
    stream_id: str
    user_id: UUID
    plaid_item_id: UUID
    account_id: UUID
    merchant_name: str | None
    average_amount: Decimal
    frequency: str


@dataclass
class CreatedAlert:
    id: UUID
    user_id: UUID
    alert_type: str
    severity: str
    title: str


@dataclass
class CreatedUser:
    id: UUID
    email: str
    display_name: str | None
    created_at: datetime


@dataclass
class TestContext:
    user: CreatedUser | None = None
    plaid_items: list[CreatedPlaidItem] = field(default_factory=list)
    accounts: dict[str, CreatedAccount] = field(default_factory=dict)
    transactions: list[CreatedTransaction] = field(default_factory=list)
    recurring_streams: list[CreatedRecurringStream] = field(default_factory=list)
    alerts: list[CreatedAlert] = field(default_factory=list)
    
    reference_date: date | None = None
    seed: int | None = None
    
    _cleanup_callbacks: list[tuple[int, Any]] = field(default_factory=list, repr=False)

    def get_reference_date(self) -> date:
        return self.reference_date or date.today()

    def with_reference_date(self, ref_date: date) -> "TestContext":
        self.reference_date = ref_date
        return self

    def with_seed(self, seed: int) -> "TestContext":
        self.seed = seed
        return self

    @property
    def user_id(self) -> UUID:
        if self.user is None:
            raise ValueError("No user in context")
        return self.user.id

    @property
    def primary_plaid_item(self) -> CreatedPlaidItem:
        if not self.plaid_items:
            raise ValueError("No plaid items in context")
        return self.plaid_items[0]

    @property
    def primary_plaid_item_id(self) -> UUID:
        return self.primary_plaid_item.id

    @property
    def checking_account(self) -> CreatedAccount:
        if "checking" not in self.accounts:
            raise ValueError("No checking account in context")
        return self.accounts["checking"]

    @property
    def checking_account_id(self) -> UUID:
        return self.checking_account.id

    def get_account(self, key: str) -> CreatedAccount:
        if key not in self.accounts:
            raise ValueError(f"No account with key '{key}' in context")
        return self.accounts[key]

    def add_plaid_item(self, item: CreatedPlaidItem) -> None:
        self.plaid_items.append(item)

    def add_account(self, key: str, account: CreatedAccount) -> None:
        self.accounts[key] = account

    def add_transaction(self, transaction: CreatedTransaction) -> None:
        self.transactions.append(transaction)

    def add_transactions(self, transactions: list[CreatedTransaction]) -> None:
        self.transactions.extend(transactions)

    def add_recurring_stream(self, stream: CreatedRecurringStream) -> None:
        self.recurring_streams.append(stream)

    def add_alert(self, alert: CreatedAlert) -> None:
        self.alerts.append(alert)

    def register_cleanup(self, priority: int, callback: Any) -> None:
        self._cleanup_callbacks.append((priority, callback))

    def get_cleanup_callbacks(self) -> list[Any]:
        sorted_callbacks = sorted(self._cleanup_callbacks, key=lambda x: x[0], reverse=True)
        return [cb for _, cb in sorted_callbacks]

    def transaction_count(self) -> int:
        return len(self.transactions)

    def total_transaction_amount(self) -> Decimal:
        return sum((t.amount for t in self.transactions), Decimal("0"))

    def transactions_in_category(self, category_primary: str) -> list[CreatedTransaction]:
        return [t for t in self.transactions if t.category_primary == category_primary]
