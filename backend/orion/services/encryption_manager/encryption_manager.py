from cryptography.fernet import Fernet

class encryption_manager:
    _instance = None

    def __init__(self, secret_key: str = None):
        if secret_key is None:
            secret_key = Fernet.generate_key().decode()
        self.fernet = Fernet(secret_key.encode())

    @classmethod
    def get_instance(cls, secret_key: str = None):
        if cls._instance is None:
            cls._instance = cls(secret_key)
        return cls._instance

    def encrypt(self, data: str) -> str:
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt(self, token: str) -> str:
        return self.fernet.decrypt(token.encode()).decode()