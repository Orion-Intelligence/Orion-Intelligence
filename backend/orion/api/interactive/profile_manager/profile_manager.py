import base64
import re
from datetime import timezone
from uuid import uuid4

from cryptography.fernet import Fernet
from fastapi import HTTPException
from fastapi.responses import Response

from orion.api.interactive.extension_manager.extension_socket_manager import extension_socket_manager
from orion.api.interactive.profile_manager.constants.constant import MAX_SESSIONS_PER_PLATFORM, PLATFORMS_RESULT_KEY
from orion.constants.constant import CONSTANTS
from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.shared_model.db_social_session_model import db_social_session_model


class ProfileManager:
    __instance = None

    def __init__(self):
        from orion.services.mongo_manager.mongo_controller import mongo_controller
        self._engine = mongo_controller.get_instance().get_engine()
        if ProfileManager.__instance is not None:
            raise Exception("This class is a singleton!")
        ProfileManager.__instance = self

    @staticmethod
    def get_instance():
        if ProfileManager.__instance is None:
            ProfileManager.__instance = ProfileManager()
        return ProfileManager.__instance

    @staticmethod
    def _user_key(current_user) -> str:
        return str(getattr(current_user, "id", "") or "")

    async def _tenant_cipher(self, current_user) -> Fernet:
        dek = await KeyManager.get_instance().get_or_create_dek(str(getattr(current_user, "tenant_uuid", "") or ""))
        return Fernet(dek)

    async def list_platforms(self, current_user):
        user_key = self._user_key(current_user)
        if not user_key:
            return {"status": "pending"}

        manager = extension_socket_manager.get_instance()
        reply = await manager.take_result(user_key, PLATFORMS_RESULT_KEY)
        if reply is None:
            await manager.fire(user_key, {"command": "platforms", "type": PLATFORMS_RESULT_KEY})
            return {"status": "pending"}

        if reply.get("error"):
            return {"error": reply.get("error")}
        items = (reply.get("items") if reply.get("implemented") else []) or []
        return {"result": {"items": items}}

    async def capture_session(self, current_user, platform: str, url: str):
        user_key = self._user_key(current_user)
        if not user_key:
            return {"status": "pending"}

        safe_platform = re.sub(r"[^a-z0-9]", "", str(platform or "").lower())
        result_key = f"session:{platform}"

        manager = extension_socket_manager.get_instance()
        reply = await manager.take_result(user_key, result_key)
        if reply is None:
            existing = await self._engine.count(db_social_session_model, {"user_id": user_key, "platform": safe_platform})
            if existing >= MAX_SESSIONS_PER_PLATFORM:
                return {"error": "session_limit"}
            await manager.fire(user_key, {"command": "session", "type": result_key, "platform": platform, "url": url})
            return {"status": "pending"}

        if reply.get("error"):
            return {"error": reply.get("error")}
        items = (reply.get("items") if reply.get("implemented") else []) or []
        session_file = items[0] if items else None
        if not isinstance(session_file, dict) or not session_file.get("zip_base64"):
            return {"error": "no_session_data"}

        try:
            raw = base64.b64decode(session_file["zip_base64"])
            cipher = await self._tenant_cipher(current_user)
            session_id = uuid4().hex
            encrypted = cipher.encrypt(raw)
            path = CONSTANTS.S_SESSION_RESOURCE_DIR / user_key / safe_platform / f"{session_id}.enc"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(encrypted)
            await self._engine.save(db_social_session_model(
                user_id=user_key,
                platform=safe_platform,
                session_id=session_id,
                file_name=path.name,
                byte_size=len(encrypted),
            ))
        except Exception:
            return {"error": "session_store_failed"}

        return {"result": {"platform": safe_platform, "session_id": session_id, "saved": True}}

    async def list_sessions(self, current_user):
        user_key = self._user_key(current_user)
        records = await self._engine.find(db_social_session_model, {"user_id": user_key})

        platforms: dict[str, list] = {}
        for record in records:
            platforms.setdefault(record.platform, []).append({
                "id": record.session_id,
                "capturedAt": record.created_at.replace(tzinfo=timezone.utc).isoformat(),
            })
        for sessions in platforms.values():
            sessions.sort(key=lambda item: item["capturedAt"], reverse=True)
        return {"result": {"platforms": platforms}}

    async def download_session(self, current_user, platform: str, session_id: str):
        user_key = self._user_key(current_user)
        safe_platform = re.sub(r"[^a-z0-9]", "", str(platform or "").lower())
        safe_session = re.sub(r"[^a-zA-Z0-9-]", "", str(session_id or ""))

        record = await self._engine.find_one(
            db_social_session_model,
            {"user_id": user_key, "platform": safe_platform, "session_id": safe_session},
        )
        if record is None:
            raise HTTPException(status_code=404, detail="No session data")

        path = CONSTANTS.S_SESSION_RESOURCE_DIR / user_key / safe_platform / record.file_name
        if not path.exists():
            raise HTTPException(status_code=404, detail="No session data")

        try:
            cipher = await self._tenant_cipher(current_user)
            data = cipher.decrypt(path.read_bytes())
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to decrypt session data")

        return Response(
            content=data,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{safe_platform}-{safe_session}-session.zip"'},
        )

    async def delete_session(self, current_user, platform: str, session_id: str):
        user_key = self._user_key(current_user)
        safe_platform = re.sub(r"[^a-z0-9]", "", str(platform or "").lower())
        safe_session = re.sub(r"[^a-zA-Z0-9-]", "", str(session_id or ""))

        record = await self._engine.find_one(
            db_social_session_model,
            {"user_id": user_key, "platform": safe_platform, "session_id": safe_session},
        )
        if record is not None:
            path = CONSTANTS.S_SESSION_RESOURCE_DIR / user_key / safe_platform / record.file_name
            if path.exists():
                path.unlink()
            await self._engine.delete(record)
        return {"result": {"deleted": True}}
