from __future__ import annotations

import base64
import os
import secrets
from typing import ClassVar

from argon2.low_level import Type, hash_secret_raw
from cryptography.fernet import Fernet, InvalidToken

from config import get_settings
from errors import EncryptionError


class EncryptionService:
    _VERSION_1: ClassVar[bytes] = b"\x01"
    _SALT_LENGTH: ClassVar[int] = 16
    _ARGON2_TIME_COST: ClassVar[int] = 3
    _ARGON2_MEMORY_COST: ClassVar[int] = 65536
    _ARGON2_PARALLELISM: ClassVar[int] = 4
    _ARGON2_HASH_LENGTH: ClassVar[int] = 32

    def __init__(self, encryption_key: str) -> None:
        self._key = encryption_key.encode("utf-8")

    def encrypt(self, plaintext: str) -> str:
        salt = os.urandom(self._SALT_LENGTH)
        fernet = self._derive_fernet(salt)

        try:
            ciphertext = fernet.encrypt(plaintext.encode("utf-8"))
        except Exception as e:
            raise EncryptionError(message="Encryption operation failed") from e

        payload = self._VERSION_1 + salt + ciphertext
        return base64.urlsafe_b64encode(payload).decode("ascii")

    def decrypt(self, encoded: str) -> str:
        try:
            payload = base64.urlsafe_b64decode(encoded.encode("ascii"))
        except Exception as e:
            raise EncryptionError(message="Invalid ciphertext format") from e

        if len(payload) < 1 + self._SALT_LENGTH:
            raise EncryptionError(message="Ciphertext too short")

        version = payload[0:1]

        if version == self._VERSION_1:
            return self._decrypt_v1(payload)

        raise EncryptionError(message=f"Unsupported encryption version: {version.hex()}")

    def _decrypt_v1(self, payload: bytes) -> str:
        salt = payload[1 : 1 + self._SALT_LENGTH]
        ciphertext = payload[1 + self._SALT_LENGTH :]

        fernet = self._derive_fernet(salt)

        try:
            plaintext_bytes = fernet.decrypt(ciphertext)
            return plaintext_bytes.decode("utf-8")
        except InvalidToken as e:
            raise EncryptionError(message="Decryption failed: invalid key or corrupted data") from e
        except Exception as e:
            raise EncryptionError(message="Decryption operation failed") from e

    def _derive_fernet(self, salt: bytes) -> Fernet:
        derived_key = hash_secret_raw(
            secret=self._key,
            salt=salt,
            time_cost=self._ARGON2_TIME_COST,
            memory_cost=self._ARGON2_MEMORY_COST,
            parallelism=self._ARGON2_PARALLELISM,
            hash_len=self._ARGON2_HASH_LENGTH,
            type=Type.ID,
        )
        fernet_key = base64.urlsafe_b64encode(derived_key)
        return Fernet(fernet_key)

    @staticmethod
    def generate_key() -> str:
        return secrets.token_urlsafe(32)


class EncryptionServiceContainer:
    _instance: EncryptionService | None = None

    @classmethod
    def get(cls) -> EncryptionService:
        if cls._instance is None:
            settings = get_settings()
            cls._instance = EncryptionService(settings.encryption_key)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_encryption_service() -> EncryptionService:
    return EncryptionServiceContainer.get()
