import base64
import os
import secrets

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from config import get_settings


class EncryptionError(Exception):
    def __init__(self, message: str = "Encryption operation failed") -> None:
        self.message = message
        super().__init__(self.message)


class EncryptionService:
    def __init__(self, encryption_key: str) -> None:
        self._fernet = self._create_fernet(encryption_key)

    def _create_fernet(self, key: str) -> Fernet:
        key_bytes = key.encode()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"finance_interceptor_salt",
            iterations=100000,
        )
        derived_key = base64.urlsafe_b64encode(kdf.derive(key_bytes))
        return Fernet(derived_key)

    def encrypt(self, plaintext: str) -> str:
        try:
            encrypted = self._fernet.encrypt(plaintext.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            raise EncryptionError(f"Failed to encrypt: {e}") from e

    def decrypt(self, ciphertext: str) -> str:
        try:
            encrypted = base64.urlsafe_b64decode(ciphertext.encode())
            decrypted = self._fernet.decrypt(encrypted)
            return decrypted.decode()
        except Exception as e:
            raise EncryptionError(f"Failed to decrypt: {e}") from e

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
