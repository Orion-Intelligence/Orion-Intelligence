import base64
import io
import json
import re
import zipfile
from datetime import UTC, datetime, timezone
from uuid import uuid4

from cryptography.fernet import Fernet
from fastapi import HTTPException

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

    async def capture_session(self, current_user, platform: str, url: str, session_id: str = ""):
        user_key = self._user_key(current_user)
        if not user_key:
            return {"status": "pending"}

        safe_platform = re.sub(r"[^a-z0-9]", "", str(platform or "").lower())
        safe_session = re.sub(r"[^a-zA-Z0-9-]", "", str(session_id or ""))
        result_key = f"session:{platform}"

        manager = extension_socket_manager.get_instance()
        reply = await manager.take_result(user_key, result_key)
        if reply is None:
            edit_record = None
            command = {"command": "session", "type": result_key, "platform": platform, "url": url}
            if safe_session:
                edit_record = await self._engine.find_one(
                    db_social_session_model,
                    {"user_id": user_key, "platform": safe_platform, "session_id": safe_session},
                )
                if edit_record is not None:
                    state = await self._read_session_state(current_user, user_key, safe_platform, edit_record.file_name)
                    if state is not None:
                        command["url"] = str(state.get("url") or "") or url
                        command["payload"] = {"seed": self._seed_payload(state)}
            if edit_record is None:
                existing = await self._engine.count(db_social_session_model, {"user_id": user_key, "platform": safe_platform})
                if existing >= MAX_SESSIONS_PER_PLATFORM:
                    return {"error": "session_limit"}
            await manager.fire(user_key, command)
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
            existing_record = None
            if safe_session:
                existing_record = await self._engine.find_one(
                    db_social_session_model,
                    {"user_id": user_key, "platform": safe_platform, "session_id": safe_session},
                )
            target_session_id = existing_record.session_id if existing_record is not None else session_id
            path = CONSTANTS.S_SESSION_RESOURCE_DIR / user_key / safe_platform / f"{target_session_id}.enc"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(encrypted)
            if existing_record is not None:
                existing_record.file_name = path.name
                existing_record.byte_size = len(encrypted)
                existing_record.username = str(session_file.get("username") or existing_record.username or "")
                existing_record.verified = False
                existing_record.verify_error = ""
                await self._engine.save(existing_record)
                session_id = target_session_id
            else:
                await self._engine.save(db_social_session_model(
                    user_id=user_key,
                    platform=safe_platform,
                    session_id=session_id,
                    file_name=path.name,
                    byte_size=len(encrypted),
                    username=str(session_file.get("username") or ""),
                ))
        except Exception:
            return {"error": "session_store_failed"}

        return {"result": {"platform": safe_platform, "session_id": session_id, "saved": True}}

    async def verify_session(self, current_user, platform: str, url: str, session_id: str):
        user_key = self._user_key(current_user)
        if not user_key:
            return {"error": "no_session_data"}

        safe_platform = re.sub(r"[^a-z0-9]", "", str(platform or "").lower())
        safe_session = re.sub(r"[^a-zA-Z0-9-]", "", str(session_id or ""))
        record = await self._engine.find_one(
            db_social_session_model,
            {"user_id": user_key, "platform": safe_platform, "session_id": safe_session},
        )
        if record is None:
            return {"error": "no_session_data"}

        manager = extension_socket_manager.get_instance()
        result_key = f"verify:{platform}"
        reply = await manager.take_result(user_key, result_key)
        if reply is None:
            if not await manager.has_live_socket(user_key):
                return await self._store_verification(record, False, "", "extension_required")
            state = await self._read_session_state(current_user, user_key, safe_platform, record.file_name)
            if state is None:
                return await self._store_verification(record, False, "", "session_unreadable")
            stored_url = str(state.get("url") or "") or url
            await manager.fire(user_key, {
                "command": "verify",
                "type": result_key,
                "platform": platform,
                "url": stored_url,
                "payload": {"url": stored_url, "session": self._seed_payload(state)},
            })
            return {"status": "pending"}

        items = (reply.get("items") if reply.get("implemented") else []) or []
        entry = items[0] if items and isinstance(items[0], dict) else {}
        verified = bool(reply.get("implemented")) and not reply.get("error")
        username = str(entry.get("username") or "")
        if verified and username:
            duplicate = await self._engine.find_one(
                db_social_session_model,
                (db_social_session_model.user_id == user_key)
                & (db_social_session_model.platform == safe_platform)
                & (db_social_session_model.username == username)
                & (db_social_session_model.session_id != record.session_id),
            )
            if duplicate is not None:
                return await self._store_verification(record, False, username, "user_already_exists")
        return await self._store_verification(record, verified, username, str(reply.get("error") or ""))

    async def _read_session_state(self, current_user, user_key: str, safe_platform: str, file_name: str):
        path = CONSTANTS.S_SESSION_RESOURCE_DIR / user_key / safe_platform / file_name
        if not path.exists():
            return None
        try:
            cipher = await self._tenant_cipher(current_user)
            raw = cipher.decrypt(path.read_bytes())
            with zipfile.ZipFile(io.BytesIO(raw)) as archive:
                state = json.loads(archive.read("session.json").decode("utf-8"))
        except Exception:
            return None
        state["cookies"] = [c for c in (state.get("cookies") or []) if isinstance(c, dict) and c.get("name")]
        return state

    @staticmethod
    def _seed_payload(state: dict) -> dict:
        origin = (state.get("origins") or [{}])[0] if state.get("origins") else {}
        return {
            "cookies": state.get("cookies") or [],
            "localStorage": state.get("localStorage") or {},
            "sessionStorage": state.get("sessionStorage") or {},
            "indexedDB": (origin.get("indexedDB") if isinstance(origin, dict) else None) or state.get("indexedDB") or {},
            "userAgent": str(state.get("userAgent") or ""),
        }

    async def _store_verification(self, record, verified: bool, username: str, error: str):
        record.verified = verified
        record.verify_error = error
        record.verified_at = datetime.now(UTC)
        if username:
            record.username = username
        await self._engine.save(record)
        if error:
            return {"error": error}
        return {"result": {"verified": verified, "username": username or record.username}}

    async def list_sessions(self, current_user):
        user_key = self._user_key(current_user)
        records = await self._engine.find(db_social_session_model, {"user_id": user_key})

        platforms: dict[str, list] = {}
        for record in records:
            platforms.setdefault(record.platform, []).append({
                "id": record.session_id,
                "capturedAt": record.created_at.replace(tzinfo=timezone.utc).isoformat(),
                "username": record.username,
                "verified": record.verified,
                "verifyError": record.verify_error,
                "verifiedAt": record.verified_at.replace(tzinfo=timezone.utc).isoformat() if record.verified_at else None,
            })
        for sessions in platforms.values():
            sessions.sort(key=lambda item: item["capturedAt"], reverse=True)
        return {"result": {"platforms": platforms}}

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
