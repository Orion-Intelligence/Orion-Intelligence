import base64
import re
from datetime import UTC, datetime, timezone
from uuid import uuid4

from cryptography.fernet import Fernet
from fastapi import HTTPException
from fastapi.responses import Response
from pymongo.errors import DuplicateKeyError

from orion.api.interactive.extension_manager.extension_socket_manager import extension_socket_manager
from orion.api.interactive.profile_manager.constants.constant import MAX_SESSIONS_PER_PLATFORM, PLATFORMS_RESULT_KEY
from orion.api.interactive.profile_manager.model.models import (
    SocialPersonaCreateRequest,
    SocialPersonaListResponse,
    SocialPersonaResponse,
    SocialPersonaUpdateRequest,
    SocialProfileAssignmentRequest,
    SocialProfileAssignmentResponse,
    SocialProfileCallbackRequest,
    SocialProfileCallbackResponse,
    SocialProfileConnectRequest,
    SocialProfileListResponse,
    SocialProfileResponse,
    SocialProfileUpdateRequest,
)
from orion.constants.constant import CONSTANTS
from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.shared_model.db_social_profile_management_model import (
    ManagedSocialProfile,
    SocialPersona,
    SocialPersonaAgeGroup,
    SocialProfileAssignmentStatus,
    SocialProfileConnectionStatus,
    db_social_profile_management_model,
)
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
        reply = manager.take_result(user_key, PLATFORMS_RESULT_KEY)
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
        reply = manager.take_result(user_key, result_key)
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

    async def create_persona(self, current_user, data: SocialPersonaCreateRequest) -> SocialPersonaResponse:
        record = await self._get_or_create_social_record(current_user)
        now = datetime.now(UTC)
        persona = SocialPersona(
            persona_id=str(uuid4()),
            name=data.name.strip(),
            age_group=data.age_group,
            gender=data.gender,
            country=(data.country or "").strip() or None,
            city=(data.city or "").strip() or None,
            interests=data.interests,
            adult_status=self._adult_status(data.age_group),
            created_at=now,
            updated_at=now,
        )
        if not persona.name:
            raise HTTPException(status_code=400, detail="Persona name is required")
        self._validate_interests(persona.interests)
        record.personas.append(persona)
        record.updated_at = now
        await self._engine.save(record)
        return self._persona_response(persona)

    async def get_personas(self, current_user) -> SocialPersonaListResponse:
        user_id = str(current_user.id)
        record = await self._engine.find_one(db_social_profile_management_model, db_social_profile_management_model.user_id == user_id)
        if not record:
            return SocialPersonaListResponse()
        return SocialPersonaListResponse(personas=[self._persona_response(persona) for persona in record.personas])

    async def update_persona(self, current_user, persona_id: str, data: SocialPersonaUpdateRequest) -> SocialPersonaResponse:
        record = await self._get_or_create_social_record(current_user)
        persona = self._find_persona(record, persona_id)
        if data.name is not None:
            persona.name = data.name.strip()
            if not persona.name:
                raise HTTPException(status_code=400, detail="Persona name is required")
        if data.age_group is not None:
            persona.age_group = data.age_group
            persona.adult_status = self._adult_status(data.age_group)
        if data.gender is not None:
            persona.gender = data.gender
        if data.country is not None:
            persona.country = data.country.strip() or None
        if data.city is not None:
            persona.city = data.city.strip() or None
        if data.interests is not None:
            self._validate_interests(data.interests)
            persona.interests = data.interests
        persona.updated_at = datetime.now(UTC)
        record.updated_at = persona.updated_at
        await self._engine.save(record)
        return self._persona_response(persona)

    async def delete_persona(self, current_user, persona_id: str):
        record = await self._get_or_create_social_record(current_user)
        self._find_persona(record, persona_id)
        record.personas = [persona for persona in record.personas if persona.persona_id != persona_id]
        for profile in record.profiles:
            if profile.assigned_persona_id == persona_id:
                profile.assigned_persona_id = None
                profile.assignment_status = SocialProfileAssignmentStatus.UNASSIGNED
                profile.updated_at = datetime.now(UTC)
        record.updated_at = datetime.now(UTC)
        await self._engine.save(record)
        return {"message": "Persona deleted successfully"}

    async def connect_profile(self, current_user, data: SocialProfileConnectRequest) -> SocialProfileResponse:
        record = await self._get_or_create_social_record(current_user)
        await self._validate_profile_session(current_user, record, data.platform, data.session_id)
        now = datetime.now(UTC)
        profile = ManagedSocialProfile(
            profile_id=str(uuid4()),
            platform=self._safe_platform(data.platform),
            profile_name=(data.profile_name or "").strip() or None,
            profile_username=(data.profile_username or "").strip() or None,
            session_id=data.session_id,
            purposes=data.purposes,
            connection_status=SocialProfileConnectionStatus.CONNECTED,
            created_at=now,
            updated_at=now,
        )
        record.profiles.append(profile)
        record.updated_at = now
        await self._engine.save(record)
        return self._profile_response(profile)

    async def get_profiles(self, current_user) -> SocialProfileListResponse:
        user_id = str(current_user.id)
        record = await self._engine.find_one(db_social_profile_management_model, db_social_profile_management_model.user_id == user_id)
        if not record:
            return SocialProfileListResponse()
        return SocialProfileListResponse(profiles=[self._profile_response(profile) for profile in record.profiles])

    async def update_profile(self, current_user, profile_id: str, data: SocialProfileUpdateRequest) -> SocialProfileResponse:
        record = await self._get_or_create_social_record(current_user)
        profile = self._find_profile(record, profile_id)
        if data.profile_name is not None:
            profile.profile_name = data.profile_name.strip() or None
        if data.profile_username is not None:
            profile.profile_username = data.profile_username.strip() or None
        if data.connection_status is not None:
            profile.connection_status = data.connection_status
        if data.session_id is not None:
            await self._validate_profile_session(current_user, record, profile.platform, data.session_id, profile.profile_id)
            profile.session_id = data.session_id
            profile.connection_status = SocialProfileConnectionStatus.CONNECTED
        if data.purposes is not None:
            profile.purposes = data.purposes
        profile.updated_at = datetime.now(UTC)
        record.updated_at = profile.updated_at
        await self._engine.save(record)
        return self._profile_response(profile)

    async def delete_profile(self, current_user, profile_id: str):
        record = await self._get_or_create_social_record(current_user)
        self._find_profile(record, profile_id)
        record.profiles = [profile for profile in record.profiles if profile.profile_id != profile_id]
        record.updated_at = datetime.now(UTC)
        await self._engine.save(record)
        return {"message": "Social profile deleted successfully"}

    async def assign_profile(self, current_user, data: SocialProfileAssignmentRequest) -> SocialProfileAssignmentResponse:
        record = await self._get_or_create_social_record(current_user)
        self._find_persona(record, data.persona_id)
        profile = self._find_profile(record, data.profile_id)
        for existing_profile in record.profiles:
            if existing_profile.profile_id == profile.profile_id:
                continue
            if existing_profile.assigned_persona_id == data.persona_id and existing_profile.platform == profile.platform:
                raise HTTPException(status_code=400, detail="This persona is already assigned to a profile on the selected platform")
        profile.assigned_persona_id = data.persona_id
        profile.assignment_status = SocialProfileAssignmentStatus.ASSIGNED
        profile.updated_at = datetime.now(UTC)
        record.updated_at = profile.updated_at
        await self._engine.save(record)
        return SocialProfileAssignmentResponse(message="Persona assigned successfully", profile=self._profile_response(profile))

    async def remove_assignment(self, current_user, profile_id: str) -> SocialProfileAssignmentResponse:
        record = await self._get_or_create_social_record(current_user)
        profile = self._find_profile(record, profile_id)
        profile.assigned_persona_id = None
        profile.assignment_status = SocialProfileAssignmentStatus.UNASSIGNED
        profile.updated_at = datetime.now(UTC)
        record.updated_at = profile.updated_at
        await self._engine.save(record)
        return SocialProfileAssignmentResponse(message="Assignment removed successfully", profile=self._profile_response(profile))

    async def callback(self, current_user, data: SocialProfileCallbackRequest) -> SocialProfileCallbackResponse:
        record = await self._get_or_create_social_record(current_user)
        profile = self._find_profile(record, data.profile_id)
        if profile.platform != self._safe_platform(data.platform):
            raise HTTPException(status_code=400, detail="Profile platform mismatch")
        profile.connection_status = SocialProfileConnectionStatus.PENDING
        profile.updated_at = datetime.now(UTC)
        record.updated_at = profile.updated_at
        await self._engine.save(record)
        return SocialProfileCallbackResponse(message="Social profile callback received", profile_id=profile.profile_id, connection_status=profile.connection_status)

    async def _get_or_create_social_record(self, current_user) -> db_social_profile_management_model:
        user_id = str(current_user.id)
        record = await self._engine.find_one(db_social_profile_management_model, db_social_profile_management_model.user_id == user_id)
        if record:
            return record
        record = db_social_profile_management_model(user_id=user_id)
        try:
            await self._engine.save(record)
        except DuplicateKeyError:
            record = await self._engine.find_one(db_social_profile_management_model, db_social_profile_management_model.user_id == user_id)
            if record:
                return record
            raise
        return record

    async def _validate_profile_session(self, current_user, record: db_social_profile_management_model, platform: str, session_id: str | None, ignored_profile_id: str = "") -> None:
        if not session_id:
            raise HTTPException(status_code=400, detail="Session is required")
        safe_platform = self._safe_platform(platform)
        for profile in record.profiles:
            if profile.profile_id != ignored_profile_id and profile.session_id == session_id:
                raise HTTPException(status_code=400, detail="This session is already assigned to another profile")
        session = await self._engine.find_one(db_social_session_model, {"user_id": str(current_user.id), "platform": safe_platform, "session_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found for selected platform")

    def _safe_platform(self, platform: str) -> str:
        return re.sub(r"[^a-z0-9]", "", str(platform or "").lower())

    def _find_persona(self, record: db_social_profile_management_model, persona_id: str) -> SocialPersona:
        for persona in record.personas:
            if persona.persona_id == persona_id:
                return persona
        raise HTTPException(status_code=404, detail="Persona not found")

    def _find_profile(self, record: db_social_profile_management_model, profile_id: str) -> ManagedSocialProfile:
        for profile in record.profiles:
            if profile.profile_id == profile_id:
                return profile
        raise HTTPException(status_code=404, detail="Social profile not found")

    def _adult_status(self, age_group: SocialPersonaAgeGroup) -> bool:
        return age_group != SocialPersonaAgeGroup.AGE_13_17

    def _validate_interests(self, interests: list[str]) -> None:
        if len(interests or []) > 3:
            raise HTTPException(status_code=400, detail="A persona can have up to 3 interests")

    def _persona_response(self, persona: SocialPersona) -> SocialPersonaResponse:
        return SocialPersonaResponse(**persona.model_dump())

    def _profile_response(self, profile: ManagedSocialProfile) -> SocialProfileResponse:
        return SocialProfileResponse(**profile.model_dump())
