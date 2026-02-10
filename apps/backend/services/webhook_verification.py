from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any, ClassVar

import jwt
from cryptography.hazmat.primitives.asymmetric.ec import EllipticCurvePublicKey
from jwt import PyJWK

from config import Settings, get_settings
from models.webhook_verification import (
    JWKPublicKey,
    WebhookVerificationFailureReason,
    WebhookVerificationResult,
)
from observability import get_logger
from services.plaid import PlaidService, PlaidServiceError, get_plaid_service
from services.webhook_key_cache import WebhookKeyCache, get_webhook_key_cache

logger = get_logger("services.webhook_verification")


class PlaidWebhookVerifier:
    _MAX_TOKEN_AGE_SECONDS: ClassVar[int] = 300
    _REQUIRED_ALGORITHM: ClassVar[str] = "ES256"

    def __init__(
        self,
        plaid_service: PlaidService,
        key_cache: WebhookKeyCache,
        settings: Settings,
    ) -> None:
        self._plaid_service = plaid_service
        self._key_cache = key_cache
        self._settings = settings

    def verify(
        self,
        plaid_verification_header: str,
        request_body: bytes,
    ) -> WebhookVerificationResult:
        log = logger.bind()

        key_id, header_error = self._extract_jwt_header(plaid_verification_header)
        if header_error is not None or key_id is None:
            reason = header_error or WebhookVerificationFailureReason.INVALID_JWT_FORMAT
            log.warning("webhook_verification.header_extraction_failed", reason=reason.value)
            return WebhookVerificationResult.failure(reason, key_id)

        log = log.bind(key_id=key_id)

        key_result = self._validate_public_key(key_id)
        if key_result is not None:
            log.warning("webhook_verification.key_validation_failed", reason=key_result.value)
            return WebhookVerificationResult.failure(key_result, key_id)

        public_key = self._get_public_key(key_id)
        if public_key is None:
            return WebhookVerificationResult.failure(
                WebhookVerificationFailureReason.KEY_NOT_FOUND, key_id
            )

        payload_result = self._validate_jwt_payload(
            plaid_verification_header, public_key, request_body, key_id
        )
        if payload_result is not None:
            return payload_result

        log.info("webhook_verification.success")
        return WebhookVerificationResult.success(key_id)

    def _validate_public_key(self, key_id: str) -> WebhookVerificationFailureReason | None:
        public_key = self._get_public_key(key_id)
        if public_key is None:
            return WebhookVerificationFailureReason.KEY_NOT_FOUND

        if public_key.expired_at is not None and public_key.expired_at < time.time():
            logger.warning(
                "webhook_verification.key_expired",
                key_id=key_id,
                expired_at=public_key.expired_at,
            )
            return WebhookVerificationFailureReason.KEY_EXPIRED

        return None

    def _validate_jwt_payload(
        self,
        jwt_token: str,
        public_key: JWKPublicKey,
        request_body: bytes,
        key_id: str,
    ) -> WebhookVerificationResult | None:
        payload = self._verify_jwt_signature(jwt_token, public_key)
        if payload is None:
            logger.warning("webhook_verification.signature_invalid", key_id=key_id)
            return WebhookVerificationResult.failure(
                WebhookVerificationFailureReason.SIGNATURE_INVALID, key_id
            )

        iat = payload.get("iat")
        if iat is None or not self._verify_token_age(iat):
            logger.warning(
                "webhook_verification.token_expired",
                key_id=key_id,
                iat=iat,
                max_age_seconds=self._MAX_TOKEN_AGE_SECONDS,
            )
            return WebhookVerificationResult.failure(
                WebhookVerificationFailureReason.TOKEN_EXPIRED, key_id
            )

        claimed_hash = payload.get("request_body_sha256")
        if claimed_hash is None or not self._verify_body_hash(request_body, claimed_hash):
            logger.warning("webhook_verification.body_hash_mismatch", key_id=key_id)
            return WebhookVerificationResult.failure(
                WebhookVerificationFailureReason.BODY_HASH_MISMATCH, key_id
            )

        return None

    def _extract_jwt_header(
        self,
        jwt_token: str,
    ) -> tuple[str | None, WebhookVerificationFailureReason | None]:
        try:
            parts = jwt_token.split(".")
            if len(parts) != 3:
                return None, WebhookVerificationFailureReason.INVALID_JWT_FORMAT

            header_b64 = parts[0]
            padding = 4 - len(header_b64) % 4
            if padding != 4:
                header_b64 += "=" * padding

            header_bytes = base64.urlsafe_b64decode(header_b64)
            header: dict[str, Any] = json.loads(header_bytes.decode("utf-8"))

            alg = header.get("alg")
            if alg != self._REQUIRED_ALGORITHM:
                logger.warning(
                    "webhook_verification.invalid_algorithm",
                    expected=self._REQUIRED_ALGORITHM,
                    actual=alg,
                )
                return None, WebhookVerificationFailureReason.INVALID_ALGORITHM

            kid = header.get("kid")
            if not kid or not isinstance(kid, str):
                return None, WebhookVerificationFailureReason.INVALID_JWT_FORMAT

            return kid, None

        except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.warning(
                "webhook_verification.header_decode_failed",
                error=str(e),
            )
            return None, WebhookVerificationFailureReason.INVALID_JWT_FORMAT

    def _get_public_key(self, key_id: str) -> JWKPublicKey | None:
        cached_key = self._key_cache.get(key_id)
        if cached_key is not None:
            logger.debug("webhook_verification.key_from_cache", key_id=key_id)
            return cached_key

        fetched_key = self._fetch_key_from_plaid(key_id)
        if fetched_key is not None:
            self._key_cache.set(fetched_key)
            logger.debug("webhook_verification.key_cached", key_id=key_id)

        return fetched_key

    def _fetch_key_from_plaid(self, key_id: str) -> JWKPublicKey | None:
        log = logger.bind(key_id=key_id)

        try:
            key_data = self._plaid_service.get_webhook_verification_key(key_id)

            if not key_data:
                log.warning("webhook_verification.plaid_returned_empty_key")
                return None

            return JWKPublicKey(
                kid=key_data.get("kid", key_id),
                alg=key_data.get("alg", "ES256"),
                kty=key_data.get("kty", "EC"),
                crv=key_data.get("crv", "P-256"),
                x=key_data.get("x", ""),
                y=key_data.get("y", ""),
                use=key_data.get("use", "sig"),
                created_at=key_data.get("created_at", 0),
                expired_at=key_data.get("expired_at"),
            )

        except PlaidServiceError as e:
            log.warning(
                "webhook_verification.plaid_key_fetch_failed",
                error=str(e),
            )
            return None
        except Exception as e:
            log.exception(
                "webhook_verification.unexpected_error_fetching_key",
                error=str(e),
            )
            return None

    def _verify_jwt_signature(
        self,
        jwt_token: str,
        public_key: JWKPublicKey,
    ) -> dict[str, Any] | None:
        try:
            jwk_dict = {
                "kty": public_key.kty,
                "crv": public_key.crv,
                "x": public_key.x,
                "y": public_key.y,
                "alg": public_key.alg,
                "use": public_key.use,
                "kid": public_key.kid,
            }

            jwk = PyJWK.from_dict(jwk_dict)
            key = jwk.key

            if not isinstance(key, EllipticCurvePublicKey):
                logger.warning(
                    "webhook_verification.invalid_key_type",
                    key_type=type(key).__name__,
                )
                return None

            payload: dict[str, Any] = jwt.decode(
                jwt_token,
                key,
                algorithms=[self._REQUIRED_ALGORITHM],
                options={
                    "verify_signature": True,
                    "verify_exp": False,
                    "verify_iat": False,
                    "verify_aud": False,
                    "require": ["iat", "request_body_sha256"],
                },
            )

            return payload

        except jwt.InvalidSignatureError:
            logger.debug("webhook_verification.jwt_signature_invalid")
            return None
        except jwt.DecodeError as e:
            logger.warning(
                "webhook_verification.jwt_decode_error",
                error=str(e),
            )
            return None
        except Exception as e:
            logger.exception(
                "webhook_verification.jwt_verification_error",
                error=str(e),
            )
            return None

    def _verify_token_age(self, iat: int) -> bool:
        current_time = int(time.time())
        token_age = current_time - iat
        return 0 <= token_age <= self._MAX_TOKEN_AGE_SECONDS

    def _verify_body_hash(self, request_body: bytes, claimed_hash: str) -> bool:
        computed_hash = hashlib.sha256(request_body).hexdigest()
        return hmac.compare_digest(computed_hash, claimed_hash)


class PlaidWebhookVerifierContainer:
    _instance: PlaidWebhookVerifier | None = None

    @classmethod
    def get(cls) -> PlaidWebhookVerifier:
        if cls._instance is None:
            plaid_service = get_plaid_service()
            key_cache = get_webhook_key_cache()
            settings = get_settings()
            cls._instance = PlaidWebhookVerifier(plaid_service, key_cache, settings)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_plaid_webhook_verifier() -> PlaidWebhookVerifier:
    return PlaidWebhookVerifierContainer.get()
