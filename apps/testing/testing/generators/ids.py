from __future__ import annotations

import random
import string
import time
from uuid import UUID, uuid4


_PLAID_CHARS = string.ascii_letters + string.digits


def _generate_plaid_style_id(length: int = 40, seed: int | None = None) -> str:
    rng = random.Random(seed)
    return "".join(rng.choices(_PLAID_CHARS, k=length))


def generate_plaid_item_id(seed: int | None = None) -> str:
    return _generate_plaid_style_id(40, seed)


def generate_plaid_account_id(seed: int | None = None) -> str:
    return _generate_plaid_style_id(40, seed)


def generate_plaid_transaction_id(seed: int | None = None) -> str:
    return _generate_plaid_style_id(40, seed)


def generate_plaid_stream_id(seed: int | None = None) -> str:
    return _generate_plaid_style_id(40, seed)


def generate_deterministic_uuid(namespace: str, identifier: str) -> UUID:
    import hashlib

    combined = f"{namespace}:{identifier}"
    hash_bytes = hashlib.sha256(combined.encode()).digest()[:16]
    hash_bytes = bytes([hash_bytes[0] & 0x0F | 0x40]) + hash_bytes[1:8] + bytes(
        [hash_bytes[8] & 0x3F | 0x80]
    ) + hash_bytes[9:16]
    return UUID(bytes=hash_bytes)


def generate_unique_id() -> UUID:
    return uuid4()


def generate_test_email(base: str = "user") -> str:
    timestamp = int(time.time() * 1000) % 1000000
    random_suffix = random.randint(1000, 9999)
    return f"test_{base}_{timestamp}_{random_suffix}@testfixture.local"


def generate_idempotency_key(prefix: str = "test") -> str:
    return f"{prefix}_{uuid4().hex[:16]}"
