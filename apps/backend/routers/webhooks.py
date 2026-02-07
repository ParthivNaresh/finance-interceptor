from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request
from pydantic import ValidationError

from config import Settings, get_settings
from errors import WebhookVerificationError
from models.webhook import PlaidWebhookRequest, WebhookAcknowledgeResponse
from models.webhook_verification import WebhookVerificationFailureReason
from observability import get_logger
from services.webhook import WebhookService, get_webhook_service
from services.webhook_verification import PlaidWebhookVerifier, get_plaid_webhook_verifier

router = APIRouter()
logger = get_logger("routers.webhooks")

WebhookServiceDep = Annotated[WebhookService, Depends(get_webhook_service)]
WebhookVerifierDep = Annotated[PlaidWebhookVerifier, Depends(get_plaid_webhook_verifier)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


@router.post(
    "/plaid",
    response_model=WebhookAcknowledgeResponse,
    summary="Receive Plaid webhooks",
    description="Endpoint for Plaid to send webhook notifications",
)
async def receive_plaid_webhook(
    request: Request,
    webhook_service: WebhookServiceDep,
    webhook_verifier: WebhookVerifierDep,
    settings: SettingsDep,
    plaid_verification: str | None = Header(default=None, alias="Plaid-Verification"),
) -> WebhookAcknowledgeResponse:
    raw_body = await request.body()

    if settings.plaid_webhook_verification_enabled:
        _verify_webhook_signature(plaid_verification, raw_body, webhook_verifier)

    webhook = _parse_webhook_body(raw_body)

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
    except Exception:
        logger.exception(
            "webhook.processing_error",
            event_id=str(event_id),
            webhook_type=webhook.webhook_type,
            webhook_code=webhook.webhook_code,
        )
        return WebhookAcknowledgeResponse(
            received=True,
            event_id=event_id,
            status="error",
        )

    return WebhookAcknowledgeResponse(
        received=True,
        event_id=event_id,
        status="processed",
    )


def _verify_webhook_signature(
    plaid_verification: str | None,
    raw_body: bytes,
    verifier: PlaidWebhookVerifier,
) -> None:
    if plaid_verification is None:
        logger.warning("webhook.verification.missing_header")
        raise WebhookVerificationError(
            message="Missing Plaid-Verification header",
            details={"reason": WebhookVerificationFailureReason.MISSING_HEADER.value},
        )

    result = verifier.verify(plaid_verification, raw_body)

    if not result.is_valid:
        logger.warning(
            "webhook.verification.failed",
            reason=result.failure_reason.value if result.failure_reason else "unknown",
            key_id=result.key_id,
        )
        raise WebhookVerificationError(
            message="Webhook signature verification failed",
            details={
                "reason": result.failure_reason.value if result.failure_reason else "unknown",
                "key_id": result.key_id,
            },
        )

    logger.debug(
        "webhook.verification.success",
        key_id=result.key_id,
    )


def _parse_webhook_body(raw_body: bytes) -> PlaidWebhookRequest:
    try:
        return PlaidWebhookRequest.model_validate_json(raw_body)
    except ValidationError as e:
        logger.warning(
            "webhook.parse_error",
            error=str(e),
        )
        raise WebhookVerificationError(
            message="Invalid webhook payload",
            code="FI-400-WEBHOOK",
            details={"validation_errors": e.errors()},
        ) from e
