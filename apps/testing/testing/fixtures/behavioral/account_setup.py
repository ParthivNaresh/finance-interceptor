from __future__ import annotations

from decimal import Decimal

from ...context import TestContext
from ..atomic import create_user, create_plaid_item, create_account
from ..atomic.account import create_checking_account, create_savings_account, create_credit_card_account


def create_user_with_bank(
    email: str | None = None,
    display_name: str | None = None,
    institution_name: str = "Test Bank",
    checking_balance: Decimal = Decimal("5000.00"),
    context: TestContext | None = None,
) -> TestContext:
    ctx = context or TestContext()

    create_user(ctx, email=email, display_name=display_name)
    create_plaid_item(ctx, institution_name=institution_name)
    create_checking_account(ctx, balance=checking_balance)

    return ctx


def create_user_with_full_bank(
    email: str | None = None,
    display_name: str | None = None,
    institution_name: str = "Test Bank",
    checking_balance: Decimal = Decimal("5000.00"),
    savings_balance: Decimal = Decimal("15000.00"),
    credit_balance: Decimal = Decimal("1500.00"),
    credit_limit: Decimal = Decimal("10000.00"),
    context: TestContext | None = None,
) -> TestContext:
    ctx = context or TestContext()

    create_user(ctx, email=email, display_name=display_name)
    create_plaid_item(ctx, institution_name=institution_name)
    create_checking_account(ctx, balance=checking_balance)
    create_savings_account(ctx, balance=savings_balance)
    create_credit_card_account(ctx, balance=credit_balance, limit=credit_limit)

    return ctx


def create_user_with_multiple_banks(
    email: str | None = None,
    display_name: str | None = None,
    banks: list[BankConfig] | None = None,
    context: TestContext | None = None,
) -> TestContext:
    ctx = context or TestContext()

    create_user(ctx, email=email, display_name=display_name)

    bank_configs = banks or [
        BankConfig(name="Chase", checking_balance=Decimal("3000.00")),
        BankConfig(name="Bank of America", checking_balance=Decimal("2000.00")),
    ]

    for i, bank in enumerate(bank_configs):
        create_plaid_item(ctx, institution_name=bank.name)

        plaid_item_id = ctx.plaid_items[i].id

        create_account(
            ctx,
            account_key=f"checking_{i}",
            name=f"{bank.name} Checking",
            account_type="depository",
            subtype="checking",
            current_balance=bank.checking_balance,
            plaid_item_id=plaid_item_id,
        )

        if bank.savings_balance is not None:
            create_account(
                ctx,
                account_key=f"savings_{i}",
                name=f"{bank.name} Savings",
                account_type="depository",
                subtype="savings",
                current_balance=bank.savings_balance,
                plaid_item_id=plaid_item_id,
            )

        if bank.credit_balance is not None:
            create_account(
                ctx,
                account_key=f"credit_{i}",
                name=f"{bank.name} Credit Card",
                account_type="credit",
                subtype="credit card",
                current_balance=bank.credit_balance,
                limit_amount=bank.credit_limit,
                plaid_item_id=plaid_item_id,
            )

    if ctx.plaid_items and "checking" not in ctx.accounts:
        first_checking = next(
            (k for k in ctx.accounts if k.startswith("checking_")), None
        )
        if first_checking:
            ctx.accounts["checking"] = ctx.accounts[first_checking]

    return ctx


class BankConfig:
    def __init__(
        self,
        name: str,
        checking_balance: Decimal = Decimal("5000.00"),
        savings_balance: Decimal | None = None,
        credit_balance: Decimal | None = None,
        credit_limit: Decimal | None = None,
    ) -> None:
        self.name = name
        self.checking_balance = checking_balance
        self.savings_balance = savings_balance
        self.credit_balance = credit_balance
        self.credit_limit = credit_limit or Decimal("10000.00")
