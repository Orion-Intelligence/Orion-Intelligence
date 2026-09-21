import asyncio
import time
from datetime import datetime, UTC
from typing import Any
from orion.api.interactive.profile_manager.profile_manager import ProfileManager
from orion.api.interactive.profile_manager.model.models import SocialAutomationResultRequest
from orion.api.interactive.social_manager.social_manager import social_manager
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.shared_model.db_social_profile_management_model import (ManagedSocialProfile, SocialPersona, SocialPersonaGender, SocialProfilePurpose)


class social_profile_job:
    __instance = None
    POST_TASK_TIMEOUT_SECONDS = 300
    AD_DETECTION_TASK_TIMEOUT_SECONDS = 900
    POLL_INTERVAL_SECONDS = 5
    ACTIVITY_KEYS = {
        "automation/post": "posting",
        "automation/ad-monitor": "ad_detection",
        "automation/hate-speech-monitor": "hate_speech",
    }

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
            self._posts_cache = {}
            self._active_runs = {}
            self._stop_daily = False
            self.is_running = False


    async def run_daily_social_profiles(self):
        if self.is_running:
            return {"status": "skipped", "message": "Already running"}
            
        self.is_running = True
        self._stop_daily = False
        try:
            records = await self._profile_manager.get_all_social_profile_records()

            processed_profile_count = 0
            skipped_profile_count = 0
            error_count = 0
            for record in records:
                if self._stop_daily:
                    break
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
    
                        if self._stop_daily:
                            log.g().i("Social profile daily processing stopped from the dashboard")
                            break
                        await self._run_profile_purposes(profile, persona, session_state, record.user_id)
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
        finally:
            self.is_running = False

    def active_runs(self, user_id: str):
        return [dict(run) for run in self._active_runs.values() if run.get("user_id") == str(user_id or "")]

    def _begin_run(self, key: str, payload: dict):
        run_id = str(payload.get("run_id") or "")
        if not run_id:
            return ""
        self._active_runs[run_id] = {
            "run_id": run_id,
            "user_id": str(payload.get("user_id") or ""),
            "profile_id": str(payload.get("profile_id") or ""),
            "platform": str(payload.get("platform") or ""),
            "activity": self.ACTIVITY_KEYS.get(key, key),
            "is_manual": bool(payload.get("is_manual")),
            "started_at": datetime.now(UTC).isoformat(),
            "step": "",
        }
        log.g().i(f"RUNDBG begin run_id={run_id} profile={self._active_runs[run_id]['profile_id']} activity={self._active_runs[run_id]['activity']} manual={self._active_runs[run_id]['is_manual']} active={[ (r['profile_id'], r['activity']) for r in self._active_runs.values() ]}")
        return run_id

    def _end_run(self, run_id: str):
        self._active_runs.pop(run_id, None)
        log.g().i(f"RUNDBG end run_id={run_id} active={[ (r['profile_id'], r['activity']) for r in self._active_runs.values() ]}")

    def cancel_run(self, user_id: str, run_id: str) -> bool:
        run = self._active_runs.get(str(run_id or ""))
        if not run or run.get("user_id") != str(user_id or ""):
            return False
        run["cancelled"] = True
        run["step"] = "stopping"
        if not run.get("is_manual"):
            self._stop_daily = True
        return True

    def _is_cancelled(self, run_id: str) -> bool:
        return bool(self._active_runs.get(run_id, {}).get("cancelled"))

    async def _record_failure(self, run_id: str, key: str, payload: dict, reason: str):
        try:
            await self._profile_manager.store_run_failure(
                str(payload.get("user_id") or ""),
                str(payload.get("profile_id") or ""),
                self.ACTIVITY_KEYS.get(key, key),
                reason,
                bool(payload.get("is_manual")),
            )
        except Exception as exc:
            log.g().e(f"Failed to store run failure for {key}: {exc}")

    async def _run_and_wait(self, key: str, payload: dict, timeout_seconds: int):
        headers = social_manager._social_headers(None, None)
        deadline = time.monotonic() + timeout_seconds
        run_id = self._begin_run(key, payload)

        try:
            while time.monotonic() < deadline:
                if self._is_cancelled(run_id):
                    log.g().i(f"Social automation job for {key} stopped on request")
                    await self._record_failure(run_id, key, payload, "Stopped from the dashboard")
                    return None

                status_code, body = await social_manager.getInstance().social_request(payload, key, headers)

                if status_code != 200 or not isinstance(body, dict):
                    log.g().e(f"Social automation request failed for {key}: {status_code} {body}")
                    await self._record_failure(run_id, key, payload, f"Automation service request failed ({status_code})")
                    return None

                if body.get("status") == "error":
                    log.g().e(f"Social automation job failed for {key}: {body.get('message')}")
                    await self._record_failure(run_id, key, payload, str(body.get("message") or "Automation service reported an error"))
                    return None

                if "result" in body:
                    log.g().i(f"Social automation job {body.get('job_id')} finished")
                    return body.get("result")

                log.g().i(f"Social automation job {body.get('job_id')} pending: {body.get('step', '')}")
                if run_id in self._active_runs:
                    self._active_runs[run_id]["step"] = str(body.get("step") or "")
                await asyncio.sleep(self.POLL_INTERVAL_SECONDS)

            log.g().w(f"Social automation job for {key} timed out after {timeout_seconds}s")
            await self._record_failure(run_id, key, payload, f"Timed out after {timeout_seconds}s")
            return None
        finally:
            self._end_run(run_id)

    async def _store_result(self, result: Any):
        if not isinstance(result, dict):
            return
        try:
            data = SocialAutomationResultRequest.model_validate(result)
            log.g().i(f"Automation Result: {data.result_type} for profile {data.profile_id}")
            await self._profile_manager.store_automation_result(data)
        except Exception as exc:
            log.g().e(f"Failed to store automation result: {exc}")

    async def _run_profile_purposes(self, profile: ManagedSocialProfile, persona: SocialPersona, session_state: dict[str, Any], user_id: str):
        import uuid
        for purpose in profile.purposes:
            if self._stop_daily:
                return
            run_id = str(uuid.uuid4())

            if purpose == SocialProfilePurpose.POSTING:
                await self.run_posting(profile, persona, session_state, run_id, user_id)
            elif purpose == SocialProfilePurpose.AD_MONITORING:
                await self.run_ad_monitoring(profile, persona, session_state, run_id, user_id)
            elif purpose == SocialProfilePurpose.HATE_SPEECH_MONITORING:
                await self.run_hate_speech_monitoring(profile, persona, session_state, run_id, user_id)

    @staticmethod
    def _persona_post_key(persona: SocialPersona) -> tuple[str, str, tuple[str, ...]]:
        gender_val = persona.gender.value if persona.gender else ""
        age_group_val = persona.age_group.value if persona.age_group else ""
        return gender_val, age_group_val, tuple(sorted(persona.interests or []))

    @staticmethod
    def persona_post_key_label(persona: SocialPersona) -> str:
        gender_val, age_group_val, interests = social_profile_job._persona_post_key(persona)
        return ", ".join(part for part in [gender_val or "any gender", age_group_val or "any age", ", ".join(interests) or "no interests"] if part)

    async def load_persona_posts(self, persona: SocialPersona) -> list[dict[str, Any]]:
        cache_key = self._persona_post_key(persona)
        if cache_key in self._posts_cache:
            return self._posts_cache[cache_key]
        gender_val, age_group_val, interests = cache_key
        interests_list = list(interests)
        posts: list[dict[str, Any]] = []
        try:
            from orion.services.mongo_manager.mongo_controller import mongo_controller
            collection = mongo_controller.get_instance().get_engine().database["persona_posts"]
            base_query: dict[str, Any] = {"age_group": age_group_val}
            if interests_list:
                base_query["interests"] = {"$all": interests_list, "$size": len(interests_list)}
            else:
                base_query["interests"] = {"$size": 0}
            queries = [dict(base_query, gender=gender_val), base_query] if gender_val and gender_val != SocialPersonaGender.UNSPECIFIED.value else [base_query]
            for query in queries:
                doc = await collection.find_one(query)
                if doc and doc.get("posts"):
                    posts = doc["posts"]
                    break
        except Exception as e:
            log.g().e(f"Failed to fetch persona posts from mongo: {e}")
            return []
        self._posts_cache[cache_key] = posts
        return posts

    async def has_post_data(self, persona: SocialPersona) -> bool:
        return bool(await self.load_persona_posts(persona))

    async def run_posting(self, profile: ManagedSocialProfile, persona: SocialPersona, session_state: dict[str, Any], run_id: str, user_id: str = "", is_manual: bool = False):
        log.g().i(f"Running posting for profile {profile.profile_id} on {profile.platform}")
        
        from datetime import timezone
        now = datetime.now(timezone.utc)
        created = persona.created_at.replace(tzinfo=timezone.utc) if persona.created_at.tzinfo is None else persona.created_at
        days_active = (now - created).days + 1
        day_index = ((days_active - 1) % 365) + 1
        
        posts_list = await self.load_persona_posts(persona)
        if not posts_list:
            reason = f"No post content is available for this persona ({self.persona_post_key_label(persona)})"
            log.g().e(f"{reason}; profile {profile.profile_id}")
            await self._profile_manager.store_run_failure(user_id, profile.profile_id, "posting", reason, is_manual)
            return
            
        post_data = next((p for p in posts_list if p.get("day") == day_index), None)
        if not post_data:
            idx = (day_index - 1) % len(posts_list)
            post_data = posts_list[idx]
        
        image_url = post_data.get("image_url")
        caption = post_data.get("caption")
        
        try:
            headers = social_manager._social_headers(None, None)

            payload = {
                "run_id": run_id,
                "user_id": user_id,
                "profile_id": profile.profile_id,
                "platform": profile.platform,
                "text": caption,
                "image_url": image_url,
                "session_state": session_state,
                "is_manual": is_manual,
            }

            result = await self._run_and_wait("automation/post", payload, self.POST_TASK_TIMEOUT_SECONDS)
            if isinstance(result, dict) and isinstance(result.get("post_result"), dict):
                result["post_result"].setdefault("post_text", caption or "")
                result["post_result"].setdefault("image_url", image_url or "")
            await self._store_result(result)

            status_code, resp_body = await social_manager.getInstance().social_request(
                payload,
                "automation/post",
                headers
            )
            log.g().i(f"run_posting API response: {status_code} {resp_body}")

        except Exception as e:
            log.g().e(f"Failed to run posting for profile {profile.profile_id}: {e}")

    async def run_ad_monitoring(self, profile: ManagedSocialProfile, persona: SocialPersona, session_state: dict[str, Any], run_id: str, user_id: str = "", is_manual: bool = False):

        log.g().i(f"Running ad monitoring for profile {profile.profile_id} on {profile.platform}")
        
        try:

            headers = social_manager._social_headers(None, None)
            payload = {
                "run_id": run_id,
                "user_id": user_id,
                "profile_id": profile.profile_id,
                "platform": profile.platform,
                "session_state": session_state,
                "is_manual": is_manual,
            }
            result = await self._run_and_wait("automation/ad-monitor", payload, self.AD_DETECTION_TASK_TIMEOUT_SECONDS)
            await self._store_result(result)

            status_code, resp_body = await social_manager.getInstance().social_request(
                payload,
                "automation/ad-monitor",
                headers
            )
            log.g().i(f"run_ad_monitoring API response: {status_code} {resp_body}")
                
        except Exception as e:
            log.g().e(f"Failed to run ad monitoring for profile {profile.profile_id}: {e}")

    async def run_hate_speech_monitoring(self, profile: ManagedSocialProfile, persona: SocialPersona, session_state: dict[str, Any], run_id: str, user_id: str = "", is_manual: bool = False):
        log.g().i(f"Running hate speech monitoring for profile {profile.profile_id} on {profile.platform}")
        
        try:
            from orion.services.mongo_manager.shared_model.db_social_automation_result_model import db_social_automation_result_model
            from orion.services.mongo_manager.mongo_controller import mongo_controller
            engine = mongo_controller.get_instance().get_engine()
            record = await engine.find_one(db_social_automation_result_model, db_social_automation_result_model.user_id == user_id)
            
            post_count = 50
            if record and any(res.profile_id == profile.profile_id for res in record.hate_speech_results):
                post_count = 10

            payload = {
                "run_id": run_id,
                "user_id": user_id,
                "profile_id": profile.profile_id,
                "platform": profile.platform,
                "profile_url": profile.profile_url or "",
                "session_state": session_state,
                "post_count": post_count,
                "is_manual": is_manual,
            }
            result = await self._run_and_wait("automation/hate-speech-monitor", payload, self.AD_DETECTION_TASK_TIMEOUT_SECONDS)
            await self._store_result(result)

        except Exception as e:
            log.g().e(f"Failed to run hate speech monitoring for profile {profile.profile_id}: {e}")
