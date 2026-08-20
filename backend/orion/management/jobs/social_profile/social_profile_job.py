from typing import Any

from orion.api.interactive.profile_manager.profile_manager import ProfileManager
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.shared_model.db_social_profile_management_model import (
    ManagedSocialProfile,
    SocialPersona,
    SocialProfilePurpose,
)


class social_profile_job:
    __instance = None

    @staticmethod
    def get_instance():
        if social_profile_job.__instance is None:
            social_profile_job()
        return social_profile_job.__instance

    def __init__(self):
        if social_profile_job.__instance is not None:
            pass
        else:
            social_profile_job.__instance = self
            self._profile_manager = ProfileManager.get_instance()

    async def run_daily_social_profiles(self):
        records = await self._profile_manager.get_all_social_profile_records()
        processed_profile_count = 0
        skipped_profile_count = 0
        error_count = 0

        for record in records:
            current_user = await self._profile_manager.get_user_for_social_record(record)
            if current_user is None:
                skipped_profile_count += len(record.profiles or [])
                continue

            personas = {persona.persona_id: persona for persona in record.personas}
            for profile in record.profiles:
                try:
                    if not profile.assigned_persona_id:
                        skipped_profile_count += 1
                        continue
                    if not profile.session_id:
                        skipped_profile_count += 1
                        continue
                    if not profile.purposes:
                        skipped_profile_count += 1
                        continue

                    persona = personas.get(profile.assigned_persona_id)
                    if persona is None:
                        skipped_profile_count += 1
                        continue

                    session_state = await self._profile_manager.read_profile_session_state(current_user, profile)
                    if session_state is None:
                        skipped_profile_count += 1
                        continue

                    await self._run_profile_purposes(profile, persona, session_state)
                    processed_profile_count += 1
                except Exception as exc:
                    error_count += 1
                    log.g().e(f"Social profile daily processing failed for profile_id={profile.profile_id}: {exc}")

        return {
            "status": "success",
            "mail_status": "sent",
            "message": "Social profile daily job finished.",
            "record_count": len(records),
            "processed_profile_count": processed_profile_count,
            "skipped_profile_count": skipped_profile_count,
            "error_count": error_count,
        }

    async def _run_profile_purposes(self, profile: ManagedSocialProfile, persona: SocialPersona, session_state: dict[str, Any]):
        for purpose in profile.purposes:
            if purpose == SocialProfilePurpose.POSTING:
                await self.run_posting(profile, persona, session_state)
            elif purpose == SocialProfilePurpose.AD_MONITORING:
                await self.run_ad_monitoring(profile, persona, session_state)
            elif purpose == SocialProfilePurpose.HATE_SPEECH_MONITORING:
                await self.run_hate_speech_monitoring(profile, session_state)

    async def run_posting(self, profile: ManagedSocialProfile, persona: SocialPersona, session_state: dict[str, Any]):
        print("run_posting "*100)
        print(f"Running posting for profile {profile.profile_id}")

    async def run_ad_monitoring(self, profile: ManagedSocialProfile, persona: SocialPersona, session_state: dict[str, Any]):
        print("run_ad_monitoring "*100)
        print(f"Running ad monitoring for profile {profile.profile_id}")

    async def run_hate_speech_monitoring(self, profile: ManagedSocialProfile, session_state: dict[str, Any]):
        print("run_hate_speech_monitoring "*100)
        print(f"Running hate speech monitoring for profile {profile.profile_id}")
