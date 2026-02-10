from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Literal
from uuid import UUID

from ...client import TestClient, get_test_client
from ...context import CreatedTransaction, TestContext
from ...generators import generate_plaid_transaction_id, get_merchant_for_category


PaymentChannel = Literal["online", "in store", "other"]


def create_transaction(
    context: TestContext,
    amount: Decimal,
    transaction_date: date,
    merchant_name: str | None = None,
    category_primary: str | None = None,
    category_detailed: str | None = None,
    name: str | None = None,
    account_id: UUID | None = None,
    account_key: str | None = None,
    transaction_id: str | None = None,
    pending: bool = False,
    payment_channel: PaymentChannel = "online",
    is_internal_transfer: bool = False,
    client: TestClient | None = None,
) -> TestContext:
    db = client or get_test_client()

    final_account_id = _resolve_account_id(context, account_id, account_key)
    final_transaction_id = transaction_id or generate_plaid_transaction_id()

    if category_primary and not merchant_name:
        merchant_info = get_merchant_for_category(category_primary)
        merchant_name = merchant_info.name
        if not category_detailed:
            category_detailed = merchant_info.category_detailed

    final_name = name or merchant_name or "Unknown Transaction"
    final_category_primary = category_primary or "GENERAL_MERCHANDISE"
    final_category_detailed = category_detailed or f"{final_category_primary}_OTHER"

    data = {
        "account_id": str(final_account_id),
        "transaction_id": final_transaction_id,
        "amount": str(amount),
        "iso_currency_code": "USD",
        "date": transaction_date.isoformat(),
        "name": final_name,
        "merchant_name": merchant_name,
        "payment_channel": payment_channel,
        "pending": pending,
        "personal_finance_category_primary": final_category_primary,
        "personal_finance_category_detailed": final_category_detailed,
        "is_internal_transfer": is_internal_transfer,
    }

    result = db.insert("transactions", data)

    created_txn = CreatedTransaction(
        id=UUID(result["id"]),
        transaction_id=final_transaction_id,
        account_id=final_account_id,
        amount=amount,
        date=transaction_date,
        merchant_name=merchant_name,
        category_primary=final_category_primary,
        category_detailed=final_category_detailed,
    )

    context.add_transaction(created_txn)

    return context


def create_transactions(
    context: TestContext,
    transactions_data: list[TransactionData],
    account_id: UUID | None = None,
    account_key: str | None = None,
    client: TestClient | None = None,
) -> TestContext:
    if not transactions_data:
        return context

    db = client or get_test_client()
    final_account_id = _resolve_account_id(context, account_id, account_key)

    db_records: list[dict[str, str | bool | None]] = []
    created_transactions: list[CreatedTransaction] = []

    for txn_data in transactions_data:
        txn_id = txn_data.transaction_id or generate_plaid_transaction_id()

        merchant_name = txn_data.merchant_name
        category_detailed = txn_data.category_detailed

        if txn_data.category_primary and not merchant_name:
            merchant_info = get_merchant_for_category(txn_data.category_primary)
            merchant_name = merchant_info.name
            if not category_detailed:
                category_detailed = merchant_info.category_detailed

        final_name = txn_data.name or merchant_name or "Unknown Transaction"
        final_category_primary = txn_data.category_primary or "GENERAL_MERCHANDISE"
        final_category_detailed = category_detailed or f"{final_category_primary}_OTHER"

        db_record = {
            "account_id": str(final_account_id),
            "transaction_id": txn_id,
            "amount": str(txn_data.amount),
            "iso_currency_code": "USD",
            "date": txn_data.date.isoformat(),
            "name": final_name,
            "merchant_name": merchant_name,
            "payment_channel": txn_data.payment_channel or "online",
            "pending": txn_data.pending,
            "personal_finance_category_primary": final_category_primary,
            "personal_finance_category_detailed": final_category_detailed,
            "is_internal_transfer": txn_data.is_internal_transfer,
        }
        db_records.append(db_record)

        created_transactions.append(
            CreatedTransaction(
                id=UUID("00000000-0000-0000-0000-000000000000"),
                transaction_id=txn_id,
                account_id=final_account_id,
                amount=txn_data.amount,
                date=txn_data.date,
                merchant_name=merchant_name,
                category_primary=final_category_primary,
                category_detailed=final_category_detailed,
            )
        )

    results = db.insert_many("transactions", db_records)

    for i, result in enumerate(results):
        created_transactions[i] = CreatedTransaction(
            id=UUID(result["id"]),
            transaction_id=created_transactions[i].transaction_id,
            account_id=created_transactions[i].account_id,
            amount=created_transactions[i].amount,
            date=created_transactions[i].date,
            merchant_name=created_transactions[i].merchant_name,
            category_primary=created_transactions[i].category_primary,
            category_detailed=created_transactions[i].category_detailed,
        )

    context.add_transactions(created_transactions)

    return context


def _resolve_account_id(
    context: TestContext,
    account_id: UUID | None,
    account_key: str | None,
) -> UUID:
    if account_id:
        return account_id

    if account_key:
        return context.get_account(account_key).id

    if "checking" in context.accounts:
        return context.checking_account_id

    if context.accounts:
        first_key = next(iter(context.accounts))
        return context.accounts[first_key].id

    raise ValueError("No account available in context")


class TransactionData:
    def __init__(
        self,
        amount: Decimal,
        date: date,
        merchant_name: str | None = None,
        category_primary: str | None = None,
        category_detailed: str | None = None,
        name: str | None = None,
        transaction_id: str | None = None,
        pending: bool = False,
        payment_channel: str | None = None,
        is_internal_transfer: bool = False,
    ) -> None:
        self.amount = amount
        self.date = date
        self.merchant_name = merchant_name
        self.category_primary = category_primary
        self.category_detailed = category_detailed
        self.name = name
        self.transaction_id = transaction_id
        self.pending = pending
        self.payment_channel = payment_channel
        self.is_internal_transfer = is_internal_transfer

    @classmethod
    def expense(
        cls,
        amount: Decimal,
        date: date,
        category_primary: str,
        merchant_name: str | None = None,
    ) -> TransactionData:
        positive_amount = abs(amount)
        return cls(
            amount=positive_amount,
            date=date,
            category_primary=category_primary,
            merchant_name=merchant_name,
        )

    @classmethod
    def income(
        cls,
        amount: Decimal,
        date: date,
        source_name: str = "Direct Deposit - Employer",
    ) -> TransactionData:
        negative_amount = -abs(amount)
        return cls(
            amount=negative_amount,
            date=date,
            category_primary="INCOME",
            category_detailed="INCOME_WAGES",
            merchant_name=source_name,
            name=source_name,
        )

    @classmethod
    def transfer_out(
        cls,
        amount: Decimal,
        date: date,
        description: str = "Transfer to Savings",
    ) -> TransactionData:
        return cls(
            amount=abs(amount),
            date=date,
            category_primary="TRANSFER_OUT",
            category_detailed="TRANSFER_OUT_ACCOUNT_TRANSFER",
            name=description,
            is_internal_transfer=True,
        )

    @classmethod
    def transfer_in(
        cls,
        amount: Decimal,
        date: date,
        description: str = "Transfer from Checking",
    ) -> TransactionData:
        return cls(
            amount=-abs(amount),
            date=date,
            category_primary="TRANSFER_IN",
            category_detailed="TRANSFER_IN_ACCOUNT_TRANSFER",
            name=description,
            is_internal_transfer=True,
        )
