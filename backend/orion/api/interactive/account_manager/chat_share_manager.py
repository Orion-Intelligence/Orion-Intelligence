from datetime import timedelta
from uuid import uuid4

from fastapi import HTTPException
import jwt

from orion.api.interactive.account_manager.models.chat_history_model import ChatShareResponse
from orion.api.interactive.account_manager.models.chat_history_model import CreateChatShareRequest
from orion.api.interactive.case_manager.case_manager_helper import CaseHelperMethods
from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_chat_share_model import ChatShareMessage
from orion.services.mongo_manager.shared_model.db_chat_share_model import db_chat_share_model
from orion.services.mongo_manager.shared_model.db_chat_share_model import utc_now


class ChatShareManager:
    __instance = None

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        if ChatShareManager.__instance is not None:
            raise Exception("Singleton!")
        ChatShareManager.__instance = self

    @staticmethod
    def get_instance():
        if ChatShareManager.__instance is None:
            ChatShareManager()
        return ChatShareManager.__instance

    async def create_chat_share(self, data: CreateChatShareRequest, current_user) -> ChatShareResponse:
        messages = [message for message in data.messages if message.sender in ["user", "bot"] and message.text.strip()]
        if not messages:
            raise HTTPException(status_code=400, detail="No chat messages to share")

        share_id = str(uuid4())
        expires_at = utc_now() + timedelta(hours=data.expiresInHours)
        token = jwt.encode(
            {
                "typ": "chat_share",
                "shareId": share_id,
                "jti": str(uuid4()),
                "tenant_uuid": str(current_user.tenant_uuid),
                "userId": str(current_user.id),
                "exp": expires_at.timestamp(),
            },
            CONSTANTS.S_AUTH_SECRET_KEY,
            algorithm=CONSTANTS.S_AUTH_ALGORITHM,
        )
        await self._engine.save(db_chat_share_model(
            shareId=share_id,
            tenant_uuid=str(current_user.tenant_uuid),
            userId=str(current_user.id),
            tokenHash=CaseHelperMethods.hash_share_token(token),
            messages=[ChatShareMessage(**message.model_dump()) for message in messages],
            expiresAt=expires_at,
        ))
        return ChatShareResponse(
            shareId=share_id,
            token=token,
            path=f"/chat-share/{share_id}?token={token}",
            expiresAt=expires_at,
        )

    async def open_chat_share(self, share_id: str, token: str) -> dict:
        if not token:
            raise HTTPException(status_code=401, detail="Missing share token")
        try:
            payload = jwt.decode(
                token,
                CONSTANTS.S_AUTH_SECRET_KEY,
                algorithms=[CONSTANTS.S_AUTH_ALGORITHM],
                options={"verify_exp": True},
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Share link has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid share token")
        if payload.get("typ") != "chat_share" or payload.get("shareId") != share_id:
            raise HTTPException(status_code=401, detail="Invalid share token")

        record = await self._engine.find_one(
            db_chat_share_model,
            (db_chat_share_model.shareId == share_id)
            & (db_chat_share_model.tenant_uuid == payload.get("tenant_uuid"))
            & (db_chat_share_model.userId == payload.get("userId")),
        )
        if not record or record.tokenHash != CaseHelperMethods.hash_share_token(token):
            raise HTTPException(status_code=404, detail="Share link not found")
        if record.revokedAt is not None:
            raise HTTPException(status_code=403, detail="Share link has been revoked")
        if CaseHelperMethods.as_aware_utc(record.expiresAt) < utc_now():
            raise HTTPException(status_code=401, detail="Share link has expired")

        return {
            "shareId": record.shareId,
            "expiresAt": record.expiresAt,
            "messages": [message.model_dump() for message in record.messages],
        }
