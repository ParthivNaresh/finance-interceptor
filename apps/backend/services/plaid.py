from datetime import date
from decimal import Decimal
from typing import Any, ClassVar

import plaid
from plaid.api import plaid_api
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.item_get_request import ItemGetRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.transactions_sync_request import TransactionsSyncRequest

from config import Settings, get_settings
from models.transaction import PlaidTransactionData, TransactionSyncResult


class PlaidServiceError(Exception):
    def __init__(self, message: str = "Plaid operation failed") -> None:
        self.message = message
        super().__init__(self.message)


class PlaidService:
    _PLAID_HOSTS: ClassVar[dict[str, str]] = {
        "sandbox": "https://sandbox.plaid.com",
        "development": "https://development.plaid.com",
        "production": "https://production.plaid.com",
    }

    _DEFAULT_REDIRECT_URI: ClassVar[str] = "https://auth.expo.io/@pnaresh/finance-interceptor"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = self._create_client()

    def _create_client(self) -> plaid_api.PlaidApi:
        host = self._PLAID_HOSTS.get(
            self._settings.plaid_environment,
            self._PLAID_HOSTS["sandbox"],
        )
        configuration = plaid.Configuration(
            host=host,
            api_key={
                "clientId": self._settings.plaid_client_id,
                "secret": self._settings.plaid_secret,
            },
        )
        api_client = plaid.ApiClient(configuration)
        return plaid_api.PlaidApi(api_client)

    def create_link_token(
        self,
        user_id: str,
        redirect_uri: str | None = None,
    ) -> dict[str, str]:
        request_params: dict[str, Any] = {
            "user": LinkTokenCreateRequestUser(client_user_id=user_id),
            "client_name": self._settings.app_name,
            "products": [Products("transactions")],
            "country_codes": [CountryCode("US")],
            "language": "en",
            "redirect_uri": redirect_uri or self._DEFAULT_REDIRECT_URI,
        }

        if self._settings.plaid_webhook_url:
            request_params["webhook"] = self._settings.plaid_webhook_url

        request = LinkTokenCreateRequest(**request_params)
        response = self._client.link_token_create(request)
        return response.to_dict()

    def exchange_public_token(self, public_token: str) -> dict[str, str]:
        request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = self._client.item_public_token_exchange(request)
        return {
            "access_token": response.access_token,
            "item_id": response.item_id,
        }

    def get_item(self, access_token: str) -> dict[str, Any]:
        request = ItemGetRequest(access_token=access_token)
        response = self._client.item_get(request)
        item = response.item
        return {
            "item_id": item.item_id,
            "institution_id": item.institution_id,
            "consent_expiration_time": item.consent_expiration_time,
        }

    def get_accounts(self, access_token: str) -> list[dict[str, Any]]:
        request = AccountsGetRequest(access_token=access_token)
        response = self._client.accounts_get(request)

        accounts = []
        for account in response.accounts:
            balances = account.balances
            accounts.append({
                "account_id": account.account_id,
                "name": account.name,
                "official_name": account.official_name,
                "type": account.type.value if account.type else None,
                "subtype": account.subtype.value if account.subtype else None,
                "mask": account.mask,
                "current_balance": Decimal(str(balances.current)) if balances.current is not None else None,
                "available_balance": Decimal(str(balances.available)) if balances.available is not None else None,
                "iso_currency_code": balances.iso_currency_code or "USD",
            })

        return accounts

    def sync_transactions(
        self,
        access_token: str,
        cursor: str | None = None,
    ) -> tuple[list[PlaidTransactionData], list[PlaidTransactionData], list[str], str, bool]:
        request_params: dict[str, Any] = {"access_token": access_token}
        if cursor:
            request_params["cursor"] = cursor

        request = TransactionsSyncRequest(**request_params)
        response = self._client.transactions_sync(request)

        added = [self._parse_transaction(t) for t in response.added]
        modified = [self._parse_transaction(t) for t in response.modified]
        removed = [t.transaction_id for t in response.removed]

        return added, modified, removed, response.next_cursor, response.has_more

    def _parse_transaction(self, txn: Any) -> PlaidTransactionData:
        location = txn.location
        location_data: dict[str, Any] | None = None
        if location:
            location_data = {
                "address": location.address,
                "city": location.city,
                "region": location.region,
                "postal_code": location.postal_code,
                "country": location.country,
                "lat": float(location.lat) if location.lat else None,
                "lon": float(location.lon) if location.lon else None,
            }

        pfc = txn.personal_finance_category
        pfc_data: dict[str, str] | None = None
        if pfc:
            pfc_data = {
                "primary": pfc.primary,
                "detailed": pfc.detailed,
                "confidence_level": getattr(pfc, "confidence_level", None),
            }

        txn_date = txn.date
        if isinstance(txn_date, str):
            txn_date = date.fromisoformat(txn_date)

        auth_date = txn.authorized_date
        if isinstance(auth_date, str):
            auth_date = date.fromisoformat(auth_date)

        payment_channel = txn.payment_channel
        if payment_channel is not None and hasattr(payment_channel, "value"):
            payment_channel = payment_channel.value

        return PlaidTransactionData(
            transaction_id=txn.transaction_id,
            account_id=txn.account_id,
            amount=Decimal(str(txn.amount)),
            iso_currency_code=txn.iso_currency_code or "USD",
            date=txn_date,
            datetime=txn.datetime,
            authorized_date=auth_date,
            authorized_datetime=txn.authorized_datetime,
            name=txn.name,
            merchant_name=txn.merchant_name,
            payment_channel=payment_channel,
            pending=txn.pending,
            pending_transaction_id=txn.pending_transaction_id,
            category_id=txn.category_id,
            category=txn.category,
            personal_finance_category=pfc_data,
            location=location_data,
            logo_url=txn.logo_url,
            website=txn.website,
            check_number=txn.check_number,
        )


class PlaidServiceContainer:
    _instance: PlaidService | None = None

    @classmethod
    def get(cls) -> PlaidService:
        if cls._instance is None:
            settings = get_settings()
            cls._instance = PlaidService(settings)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_plaid_service() -> PlaidService:
    return PlaidServiceContainer.get()
