from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Literal


class WebhookVerificationFailureReason(StrEnum):
    MISSING_HEADER = "missing_verification_header"
    INVALID_JWT_FORMAT = "invalid_jwt_format"
    INVALID_ALGORITHM = "invalid_algorithm"
    KEY_FETCH_FAILED = "key_fetch_failed"
    KEY_NOT_FOUND = "key_not_found"
    KEY_EXPIRED = "key_expired"
    SIGNATURE_INVALID = "signature_invalid"
    TOKEN_EXPIRED = "token_expired"
    BODY_HASH_MISMATCH = "body_hash_mismatch"
    VERIFICATION_ERROR = "verification_error"


@dataclass(frozen=True, slots=True)
class JWKPublicKey:
    kid: str
    alg: str
    kty: str
    crv: str
    x: str
    y: str
    use: str
    created_at: int
    expired_at: int | None


@dataclass(frozen=True, slots=True)
class CachedKey:
    key: JWKPublicKey
    cached_at: float


@dataclass(frozen=True, slots=True)
class WebhookVerificationResult:
    is_valid: bool
    failure_reason: WebhookVerificationFailureReason | None = None
    key_id: str | None = None

    @classmethod
    def success(cls, key_id: str) -> WebhookVerificationResult:
        return cls(is_valid=True, failure_reason=None, key_id=key_id)

    @classmethod
    def failure(
        cls,
        reason: WebhookVerificationFailureReason,
        key_id: str | None = None,
    ) -> WebhookVerificationResult:
        return cls(is_valid=False, failure_reason=reason, key_id=key_id)


@dataclass(frozen=True, slots=True)
class JWTHeader:
    alg: str
    kid: str
    typ: str


@dataclass(frozen=True, slots=True)
class JWTPayload:
    iat: int
    request_body_sha256: str


WebhookVerificationStatus = Literal["verified", "skipped", "failed"]
