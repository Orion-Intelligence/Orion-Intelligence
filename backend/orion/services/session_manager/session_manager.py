import threading
import time
from datetime import datetime, timedelta, timezone
import secrets

import jwt
import pyotp
from bson import ObjectId
from fastapi import HTTPException, status
from starlette.responses import JSONResponse

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import user_role, db_user_account, UserStatus
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model, TenantStatus
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS


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
        self._redis = redis_controller.getInstance()
        self._session_ttl = 30 * 60

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
                options={"verify_exp": True}, )
            username: str = payload.get("sub")
            if not username:
                raise HTTPException(status_code=401, detail="Missing or invalid token")

            user = await self._engine.find_one(db_user_account, db_user_account.username == username)
            if payload.get("free") is True:
                return user

            if not user:
                raise HTTPException(status_code=401, detail="Missing or invalid token")

            session_id = payload.get("sid")
            if user.role in (user_role.CRAWLER):
                return user

            if not session_id:
                raise HTTPException(status_code=401, detail="Missing or invalid token")

            redis_key = f"session:{str(user.id)}"
            redis_sid = await self._redis.invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [redis_key, None, None])

            if redis_sid is None:
                if user.current_session_id != session_id:
                    raise HTTPException(status_code=401, detail="Logged out due to multiple active sessions")
                await self._redis.invoke_trigger(
                    REDIS_COMMANDS.S_SET_STRING,
                    [redis_key, session_id, self._session_ttl])
            else:
                if redis_sid != user.current_session_id or redis_sid != session_id:
                    raise HTTPException(status_code=401, detail="Logged out due to multiple active sessions")
                await self._redis.invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [redis_key, redis_sid, self._session_ttl])

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

    async def create_access_token(self, data: dict, expires_delta: timedelta | None = None, free=False):
        to_encode = data.copy()
        username = to_encode.get("sub")

        if not free:
            if expires_delta is None:
                expires_delta = timedelta(minutes=30)

        user = None
        if username:
            user = await self._engine.find_one(db_user_account, db_user_account.username == username)

        if not free and user and user.role not in (user_role.CRAWLER) and expires_delta > timedelta(minutes=30):
            expires_delta = timedelta(minutes=30)

        expire = datetime.now(timezone.utc) + expires_delta if not free else None

        session_id = None
        if user and user.role not in (user_role.CRAWLER) and not free:
            session_id = secrets.token_urlsafe(32)
            user.current_session_id = session_id
            await self._engine.save(user)
            redis_key = f"session:{str(user.id)}"
            await self._redis.invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [redis_key, session_id, self._session_ttl])

        if session_id:
            to_encode.update({"exp": expire.timestamp(), "sid": session_id})
        elif not free:
            to_encode.update({"exp": expire.timestamp()})

        if free:
            to_encode.update({"free": True})

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
                options={"verify_exp": True}, )
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
            if user.role not in (user_role.CRAWLER) and access_ttl > timedelta(minutes=30):
                access_ttl = timedelta(minutes=30)

            access_token, _role = await self.create_access_token({"sub": username}, access_ttl)
            onboarding_exists = await self.get_instance().has_onboarding(str(user.tenant_uuid))
            session = {"username": user.username, "role": user.role.value if hasattr(user.role, "value") else str(
                user.role), "status": user.status.value if hasattr(user.status, "value") else str(
                user.status), "hasOnboarding": onboarding_exists, "subscription": user.subscription, "verificationDate": user.account_verify_at.isoformat() if user.account_verify_at else None, "licenses": [
                license.value for license in user.licenses], }
            return {"access_token": access_token, "token_type": "bearer", "session": session}

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
                options={"verify_exp": True}, )
            if payload.get("free") is True:
                return {"access_token": token, "token_type": "bearer"}

            username = payload.get("sub")
            if not username:
                raise HTTPException(status_code=401, detail="Invalid token")

            user = await self._engine.find_one(db_user_account, db_user_account.username == username)
            if not user:
                raise HTTPException(status_code=401, detail="User not found")

            session_id = payload.get("sid")
            if user.role not in (user_role.CRAWLER):
                if not session_id:
                    raise HTTPException(status_code=401, detail="Invalid token")

                redis_key = f"session:{str(user.id)}"
                redis_sid = await self._redis.invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [redis_key, None, None])

                if redis_sid is None:
                    if user.current_session_id != session_id:
                        raise HTTPException(status_code=401, detail="Invalid token")
                    await self._redis.invoke_trigger(
                        REDIS_COMMANDS.S_SET_STRING,
                        [redis_key, session_id, self._session_ttl])
                else:
                    if redis_sid != user.current_session_id or redis_sid != session_id:
                        raise HTTPException(status_code=401, detail="Invalid token")
                    await self._redis.invoke_trigger(
                        REDIS_COMMANDS.S_SET_STRING,
                        [redis_key, redis_sid, self._session_ttl])

            role_name = (getattr(user.role, "value", str(user.role))).split(".")[-1].lower()
            acct_at = user.account_verify_at
            if isinstance(acct_at, datetime):
                acct_at = acct_at if acct_at.tzinfo else acct_at.replace(tzinfo=timezone.utc)
            if role_name == "member" and not bool(getattr(user, "subscription", False)) and acct_at is not None and (
                    datetime.now(timezone.utc) - acct_at).days >= 30:
                raise HTTPException(status_code=402, detail="Trial expired. Please subscribe to continue.")

            onboarding_exists = await self.has_onboarding(str(user.tenant_uuid))

            base_expiry = time.time() + CONSTANTS.S_AUTH_ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 60 * 24
            if user.role not in (user_role.CRAWLER):
                base_expiry = time.time() + 3 * 60

            if user.role in (user_role.CRAWLER):
                new_token_payload = {"sub": username, "exp": base_expiry}
            else:
                new_token_payload = {"sub": username, "exp": base_expiry, "sid": session_id}

            new_token = jwt.encode(new_token_payload, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)

            session = {"username": user.username, "role": user.role.value if hasattr(user.role, "value") else str(
                user.role), "status": user.status.value if hasattr(user.status, "value") else str(
                user.status), "hasOnboarding": onboarding_exists, "subscription": user.subscription, "verificationDate": user.account_verify_at.isoformat() if user.account_verify_at else None, "licenses": [
                license.value for license in user.licenses], }

            return {"access_token": new_token, "token_type": "bearer", "session": session}

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

    async def has_onboarding(self, company_id: str) -> bool:
        engine = self._engine
        if company_id == "":
            return False
        onboarding = await engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(company_id))
        if onboarding and onboarding.status == TenantStatus.ONBOARDING:
            return True
        else:
            return False

    @staticmethod
    def generate_verification_token():
        return secrets.token_urlsafe(32)

    @staticmethod
    def logout_user(ptoken: str):
        if not ptoken:
            return
