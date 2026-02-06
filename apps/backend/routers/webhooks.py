from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from config import Settings, get_settings
from models.webhook import PlaidWebhookRequest, WebhookAcknowledgeResponse
from services.webhook import WebhookService, get_webhook_service

router = APIRouter()

WebhookServiceDep = Annotated[WebhookService, Depends(get_webhook_service)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


@router.post(
    "/plaid",
    response_model=WebhookAcknowledgeResponse,
    summary="Receive Plaid webhooks",
    description="Endpoint for Plaid to send webhook notifications",
)
async def receive_plaid_webhook(
    request: Request,
    webhook: PlaidWebhookRequest,
    webhook_service: WebhookServiceDep,
    settings: SettingsDep,
    plaid_verification: str | None = Header(default=None, alias="Plaid-Verification"),
) -> WebhookAcknowledgeResponse:
    if settings.plaid_environment != "sandbox" and plaid_verification:
        body = await request.body()
        if not webhook_service.verify_signature(
            body,
            plaid_verification,
            settings.plaid_webhook_secret,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature",
            )

    idempotency_key = webhook_service.generate_idempotency_key(webhook)
    if webhook_service.is_duplicate(idempotency_key):
        return WebhookAcknowledgeResponse(
            received=True,
            event_id=None,
            status="duplicate",
        )

    payload = webhook.model_dump()
    event_id = webhook_service.store_event(webhook, payload)

    try:
        await webhook_service.process_webhook_async(webhook, event_id)
    except Exception as e:
        return WebhookAcknowledgeResponse(
            received=True,
            event_id=event_id,
            status=f"error: {e}",
        )

    return WebhookAcknowledgeResponse(
        received=True,
        event_id=event_id,
        status="processed",
    )
