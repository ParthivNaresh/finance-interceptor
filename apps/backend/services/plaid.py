from typing import ClassVar

import plaid
from plaid.api import plaid_api
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products

from config import Settings, get_settings


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
        request = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(client_user_id=user_id),
            client_name=self._settings.app_name,
            products=[Products("transactions")],
            country_codes=[CountryCode("US")],
            language="en",
            redirect_uri=redirect_uri or self._DEFAULT_REDIRECT_URI,
        )
        response = self._client.link_token_create(request)
        return response.to_dict()

    def exchange_public_token(self, public_token: str) -> dict[str, str]:
        request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = self._client.item_public_token_exchange(request)
        return {
            "access_token": response.access_token,
            "item_id": response.item_id,
        }


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
