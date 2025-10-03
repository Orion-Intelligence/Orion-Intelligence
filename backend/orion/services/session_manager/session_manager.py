import threading
import time
from datetime import datetime, timedelta, timezone
import secrets

import jwt
import pyotp
from fastapi import HTTPException, status
from starlette.responses import JSONResponse

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import user_role, db_user_account,UserStatus
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model


class session_manager:
    __instance = None
    __lock = threading.Lock()

    @staticmethod
    def get_instance():
        if session_manager.__instance is None:
            with session_manager.__lock:
                if session_manager.__instance is None:
                    session_manager.__instance = session_manager()
        return session_manager.__instance

    def __init__(self):
        if session_manager.__instance is not None:
            raise Exception("This class is a singleton!")
        session_manager.__instance = self
        self._engine = mongo_controller.get_instance().get_engine()

    async def get_current_user(self, token: str):
        if not token:
            raise HTTPException(status_code=401, detail="Missing or invalid token")

        token = token.strip()
        if token.startswith("Bearer "):
            token = token[len("Bearer "):].strip()

        try:
            payload = jwt.decode(
                token,
                CONSTANTS.S_AUTH_SECRET_KEY,
                algorithms=[CONSTANTS.S_AUTH_ALGORITHM],
                options={"verify_exp": True},
            )
            username: str = payload.get("sub")

            if not username:
                raise HTTPException(status_code=401, detail="Missing or invalid token")

            user = await self._engine.find_one(db_user_account, db_user_account.username == username)
            if not user:
                raise HTTPException(status_code=401, detail="Missing or invalid token")

            return user

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

    async def get_current_role(self, token: str) -> str:
        user = await self.get_current_user(token)
        if not user or isinstance(user, JSONResponse):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

        role = user.role
        try:
            _ = user_role(role)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")
        return role
    

    async def get_current_status(self, token: str) -> str:
        user = await self.get_current_user(token)
        if not user or isinstance(user, JSONResponse):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

        user_status = user.status
        try:
            _ = UserStatus(user_status)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User access not found")
        return user_status

    async def create_access_token(self, data: dict, expires_delta: timedelta | None = None):
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire.timestamp()})
        token = jwt.encode(to_encode, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)
        role = await self.get_current_role(token)
        return token, role

    @staticmethod
    async def create_temp_token(username: str, ttl_minutes: int = 5, extra: dict | None = None) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)
        payload = {"sub": username, "exp": expire.timestamp(), "twofa": True}
        if extra:
            payload.update(extra)
        return jwt.encode(payload, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)

    async def verify_2fa_and_issue(self, temp_token: str, code: str):
        try:
            payload = jwt.decode(
                temp_token,
                CONSTANTS.S_AUTH_SECRET_KEY,
                algorithms=[CONSTANTS.S_AUTH_ALGORITHM],
                options={"verify_exp": True},
            )
            if not payload.get("twofa"):
                raise HTTPException(status_code=401, detail="Invalid 2FA token")

            username = payload.get("sub")
            if not username:
                raise HTTPException(status_code=401, detail="Invalid 2FA token")

            user = await self._engine.find_one(db_user_account, db_user_account.username == username)
            if not user:
                raise HTTPException(status_code=401, detail="User not found")

            secret = user.twofa_secret or payload.get("tfa_secret")
            if not secret:
                raise HTTPException(status_code=401, detail="Missing 2FA secret")

            if not pyotp.TOTP(secret).verify(code, valid_window=1):
                raise HTTPException(status_code=401, detail="Invalid 2FA code")

            if not user.twofa_secret:
                user.twofa_secret = secret
                user.twofa_enabled = True
                await self._engine.save(user)

            access_ttl = timedelta(weeks=92) if user.role == user_role.CRAWLER else timedelta(minutes=30)
            access_token, role = await self.create_access_token({"sub": username}, access_ttl)
            onboarding_exists = await self.get_instance().has_onboarding(str(user.id))
            return {"access_token": access_token, "token_type": "bearer", "role": role,"hasOnboarding": onboarding_exists}

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="2FA token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid 2FA token")

    async def refresh_token(self, token: str):
        try:
            payload = jwt.decode(
                token,
                CONSTANTS.S_AUTH_SECRET_KEY,
                algorithms=[CONSTANTS.S_AUTH_ALGORITHM],
                options={"verify_exp": True},
            )
            username = payload.get("sub")

            if not username:
                raise HTTPException(status_code=401, detail="Invalid token")

            user = await self._engine.find_one(db_user_account, db_user_account.username == username)
            if not user:
                raise HTTPException(status_code=401, detail="User not found")

            new_token_expiry = time.time() + CONSTANTS.S_AUTH_ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 60 * 24
            new_token_payload = {"sub": username, "exp": new_token_expiry}
            new_token = jwt.encode(new_token_payload, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)

            onboarding_exists = await self.has_onboarding(str(user.id))
            return {"role": user.role.value, "access_token": new_token, "token_type": "bearer","hasOnboarding": onboarding_exists}

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired, please log in again")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

    async def has_onboarding(self, user_id: str) -> bool:
        engine = self._engine
        onboarding = await engine.find_one(db_tenant_model, db_tenant_model.userId == user_id)
        return onboarding is not None
    
    @staticmethod
    def generate_verification_token():
        return secrets.token_urlsafe(32) 

    @staticmethod
    def logout_user(ptoken: str):
        if not ptoken:
            return
