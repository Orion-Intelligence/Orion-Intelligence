from datetime import UTC, datetime
from uuid import uuid4

from fastapi import HTTPException

from orion.api.interactive.social_profile_management.models import (
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
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_social_profile_management_model import (
    ManagedSocialProfile,
    SocialPersona,
    SocialPersonaAgeGroup,
    SocialProfileAssignmentStatus,
    SocialProfileConnectionStatus,
    SocialProfilePlatform,
    db_social_profile_management_model,
)


class SocialProfileManagementManager:
    __instance = None

    PLATFORM_LOGIN_URLS = {
        SocialProfilePlatform.FACEBOOK: "https://www.facebook.com/login/",
        SocialProfilePlatform.X: "https://x.com/i/flow/login",
    }

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        if SocialProfileManagementManager.__instance is not None:
            raise Exception("This class is a singleton!")
        SocialProfileManagementManager.__instance = self

    @staticmethod
    def get_instance():
        if SocialProfileManagementManager.__instance is None:
            SocialProfileManagementManager()
        return SocialProfileManagementManager.__instance

    async def create_persona(self, current_user, data: SocialPersonaCreateRequest) -> SocialPersonaResponse:
        record = await self._get_or_create_record(current_user)
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
        record = await self._get_or_create_record(current_user)
        return SocialPersonaListResponse(personas=[self._persona_response(persona) for persona in record.personas])

    async def update_persona(self, current_user, persona_id: str, data: SocialPersonaUpdateRequest) -> SocialPersonaResponse:
        record = await self._get_or_create_record(current_user)
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
        record = await self._get_or_create_record(current_user)
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
        record = await self._get_or_create_record(current_user)
        now = datetime.now(UTC)
        profile = ManagedSocialProfile(
            profile_id=str(uuid4()),
            platform=data.platform,
            profile_name=(data.profile_name or "").strip() or None,
            profile_username=(data.profile_username or "").strip() or None,
            connection_status=SocialProfileConnectionStatus.PENDING,
            created_at=now,
            updated_at=now,
        )
        record.profiles.append(profile)
        record.updated_at = now
        await self._engine.save(record)
        return self._profile_response(profile, self.PLATFORM_LOGIN_URLS.get(profile.platform))

    async def reconnect_profile(self, current_user, profile_id: str) -> SocialProfileResponse:
        record = await self._get_or_create_record(current_user)
        profile = self._find_profile(record, profile_id)
        profile.connection_status = SocialProfileConnectionStatus.PENDING
        profile.session_data = None
        profile.last_session_check = None
        profile.updated_at = datetime.now(UTC)
        record.updated_at = profile.updated_at
        await self._engine.save(record)
        return self._profile_response(profile, self.PLATFORM_LOGIN_URLS.get(profile.platform))

    async def get_profiles(self, current_user) -> SocialProfileListResponse:
        record = await self._get_or_create_record(current_user)
        return SocialProfileListResponse(profiles=[self._profile_response(profile) for profile in record.profiles])

    async def update_profile(self, current_user, profile_id: str, data: SocialProfileUpdateRequest) -> SocialProfileResponse:
        record = await self._get_or_create_record(current_user)
        profile = self._find_profile(record, profile_id)
        if data.profile_name is not None:
            profile.profile_name = data.profile_name.strip() or None
        if data.profile_username is not None:
            profile.profile_username = data.profile_username.strip() or None
        if data.connection_status is not None:
            profile.connection_status = data.connection_status
        profile.updated_at = datetime.now(UTC)
        record.updated_at = profile.updated_at
        await self._engine.save(record)
        return self._profile_response(profile)

    async def delete_profile(self, current_user, profile_id: str):
        record = await self._get_or_create_record(current_user)
        self._find_profile(record, profile_id)
        record.profiles = [profile for profile in record.profiles if profile.profile_id != profile_id]
        record.updated_at = datetime.now(UTC)
        await self._engine.save(record)
        return {"message": "Social profile deleted successfully"}

    async def assign_profile(self, current_user, data: SocialProfileAssignmentRequest) -> SocialProfileAssignmentResponse:
        record = await self._get_or_create_record(current_user)
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
        record = await self._get_or_create_record(current_user)
        profile = self._find_profile(record, profile_id)
        profile.assigned_persona_id = None
        profile.assignment_status = SocialProfileAssignmentStatus.UNASSIGNED
        profile.updated_at = datetime.now(UTC)
        record.updated_at = profile.updated_at
        await self._engine.save(record)
        return SocialProfileAssignmentResponse(message="Assignment removed successfully", profile=self._profile_response(profile))

    async def callback(self, current_user, data: SocialProfileCallbackRequest) -> SocialProfileCallbackResponse:
        record = await self._get_or_create_record(current_user)
        profile = self._find_profile(record, data.profile_id)
        if profile.platform != data.platform:
            raise HTTPException(status_code=400, detail="Profile platform mismatch")
        # TODO: Complete session validation and persistence when platform authentication is implemented.
        profile.connection_status = SocialProfileConnectionStatus.PENDING
        profile.updated_at = datetime.now(UTC)
        record.updated_at = profile.updated_at
        await self._engine.save(record)
        return SocialProfileCallbackResponse(
            message="Social profile callback received",
            profile_id=profile.profile_id,
            connection_status=profile.connection_status,
        )

    async def _get_or_create_record(self, current_user) -> db_social_profile_management_model:
        user_id = str(current_user.id)
        record = await self._engine.find_one(db_social_profile_management_model, db_social_profile_management_model.user_id == user_id)
        if record:
            return record
        record = db_social_profile_management_model(user_id=user_id, tenant_id=str(getattr(current_user, "tenant_uuid", "") or ""))
        await self._engine.save(record)
        return record

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

    def _profile_response(self, profile: ManagedSocialProfile, login_url: str | None = None) -> SocialProfileResponse:
        payload = profile.model_dump()
        payload["login_url"] = login_url
        return SocialProfileResponse(**payload)
