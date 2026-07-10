import base64
import binascii
import hashlib
import os
from datetime import UTC, datetime

import httpx
import jwt
from fastapi import HTTPException
from fastapi.responses import JSONResponse, Response

from configs.auth_cookie import token_from_request
from orion.constants.constant import CONSTANTS
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_social_model import db_social_model


class social_model:
    __instance = None
    SOCIAL_IMAGE_MAX_BYTES = 10 * 1024 * 1024
    SOCIAL_IMAGE_MAX_BASE64_LENGTH = ((SOCIAL_IMAGE_MAX_BYTES + 2) // 3) * 4

    @staticmethod
    def getInstance():
        if social_model.__instance is None:
            social_model.__instance = social_model()
        return social_model.__instance

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()

    @staticmethod
    def _normalize_username(value: str) -> str:
        return (value or "").strip().lstrip("@").lower()

    @staticmethod
    def _document_payload(record: dict) -> dict:
        profiles = record.get("profiles")
        if not isinstance(profiles, list):
            profiles = []
            legacy_profile = record.get("profile")
            if isinstance(legacy_profile, dict):
                profiles = [legacy_profile]
        profile_username = record.get("profile_username") or record.get("root_username") or ""
        return {
            "user_id": record.get("user_id"),
            "profile_username": profile_username,
            "profiles": profiles,
            "count": len(profiles),
            "updated_at": record.get("updated_at"),
        }

    @staticmethod
    def _social_hash_id(platform: str, stable_id: str) -> str:
        return hashlib.sha256("|".join([platform or "", stable_id or "", "", "", ""]).encode("utf-8")).hexdigest()

    @staticmethod
    def _social_api_base_urls() -> list[str]:
        configured = os.getenv("ORION_SOCIAL_API_BASE_URL", "").strip()
        candidates = [
            configured,
            "http://trusted-social-api:8020",
            "http://127.0.0.1:8020",
            "http://localhost:8020",
        ]
        urls: list[str] = []
        seen: set[str] = set()
        for candidate in candidates:
            url = str(candidate or "").strip().rstrip("/")
            if not url or url in seen:
                continue
            seen.add(url)
            urls.append(url)
        return urls

    @classmethod
    def _social_url(cls, base_url: str, path: str) -> str:
        return f"{base_url.rstrip('/')}/{path.lstrip('/')}"

    @staticmethod
    def _social_internal_token() -> str:
        return os.getenv("ORION_SOCIAL_INTERNAL_TOKEN", "").strip() or os.getenv("S_SUPER_PASSWORD_V1", "").strip()

    @classmethod
    def _social_headers(cls, current_user=None, request=None) -> dict[str, str]:
        headers: dict[str, str] = {}
        internal_token = cls._social_internal_token()
        if internal_token:
            headers["X-Orion-Internal-Token"] = internal_token

        if current_user is not None:
            headers["X-Orion-User"] = str(getattr(current_user, "username", "") or "")
            headers["X-Orion-User-Id"] = str(getattr(current_user, "id", "") or "")
            headers["X-Orion-Tenant-Id"] = str(getattr(current_user, "tenant_uuid", "") or "")

        token = token_from_request(request) if request is not None else ""
        if token:
            try:
                payload = jwt.decode(
                    token,
                    CONSTANTS.S_AUTH_SECRET_KEY,
                    algorithms=[CONSTANTS.S_AUTH_ALGORITHM],
                    options={"verify_exp": True},
                )
                session_id = str(payload.get("sid") or "")
                client = str(payload.get("client") or "web")
                if session_id:
                    headers["X-Orion-Session-Id"] = session_id
                if client:
                    headers["X-Orion-Session-Client"] = client
            except jwt.InvalidTokenError:
                pass
        return {key: value for key, value in headers.items() if value}

    @classmethod
    def _normalize_social_cursor(cls, payload: dict, key: str) -> dict:
        if key not in {"posts", "videos", "shorts"}:
            return payload
        hash_id = str(payload.get("hash_id") or "").strip()
        if not hash_id or (len(hash_id) == 64 and all(char in "0123456789abcdefABCDEF" for char in hash_id)):
            return payload
        if "://" not in hash_id:
            return payload
        normalized_payload = dict(payload)
        normalized_payload["hash_id"] = cls._social_hash_id(str(payload.get("platform") or "").lower(), hash_id)
        return normalized_payload

    @classmethod
    def _merge_profile_documents(cls, rows: list[dict]) -> list[dict]:
        merged: dict[str, dict] = {}
        for row in rows:
            payload = cls._document_payload(row)
            profile_username = cls._normalize_username(payload.get("profile_username") or "")
            if not profile_username:
                continue
            current = merged.setdefault(profile_username, {
                "user_id": payload.get("user_id"),
                "profile_username": profile_username,
                "profiles": [],
                "count": 0,
                "updated_at": payload.get("updated_at"),
            })
            current["profiles"].extend(payload.get("profiles") or [])
            current["count"] = len(current["profiles"])
            updated_at = payload.get("updated_at")
            if updated_at and (not current.get("updated_at") or updated_at > current["updated_at"]):
                current["updated_at"] = updated_at
        return sorted(merged.values(), key=lambda item: item.get("updated_at") or datetime.min.replace(tzinfo=UTC), reverse=True)

    async def social_search(self, model, key: str, current_user=None, request=None):
        last_error = ""
        headers = self._social_headers(current_user, request)
        try:
            for base_url in self._social_api_base_urls():
                try:
                    async with httpx.AsyncClient() as client:
                        if isinstance(model, dict) and "file_bytes" in model:
                            response = await client.post(
                                self._social_url(base_url, f"social/{key}"),
                                files={"file": (model["filename"], model["file_bytes"], "application/octet-stream")},
                                headers=headers,
                                timeout=120,
                            )
                        else:
                            payload = model.model_dump() if hasattr(model, "model_dump") else model
                            payload = self._normalize_social_cursor(payload, key) if isinstance(payload, dict) else payload
                            response = await client.post(
                                self._social_url(base_url, f"social/{key}"),
                                json=payload,
                                headers=headers,
                                timeout=120,
                            )

                    if response.status_code != 200:
                        return JSONResponse(
                            status_code=response.status_code,
                            content={"detail": "Social service request failed"},
                        )
                    return response.json()
                except httpx.RequestError as exc:
                    last_error = str(exc)
                    continue
        except Exception:
            return JSONResponse(status_code=500, content={"detail": "Failed to process social search"})
        return JSONResponse(status_code=502, content={"detail": "Social service unreachable", "error": last_error})

    async def search_recon(self, param, current_user=None, request=None):
        return await self.social_search(param, "recon", current_user, request)

    async def search_forum_profiles(self, param):
        query = self._normalize_username(getattr(param, "query", ""))
        if not query:
            return {"Result": [], "Total_Hits": 0}

        max_results = int(getattr(param, "max_results", 50) or 50)
        data_filter = {
            "size": max(1, min(max_results, 100)),
            "query": {
                "bool": {
                    "filter": [
                        {"term": {"m_platform": {"value": "forum", "case_insensitive": True}}}
                    ],
                    "should": [
                        {"term": {"m_sender_name": {"value": query, "case_insensitive": True, "boost": 6}}},
                        {"term": {"m_author": {"value": query, "case_insensitive": True, "boost": 5}}},
                        {"term": {"m_attacker": {"value": query, "case_insensitive": True, "boost": 4}}},
                        {"term": {"m_username": {"value": query, "case_insensitive": True, "boost": 4}}},
                        {"term": {"m_comments.m_username": {"value": query, "case_insensitive": True, "boost": 4}}},
                        {"match": {"m_sender_name": {"query": query, "operator": "and", "boost": 4}}},
                        {"match": {"m_author": {"query": query, "operator": "and", "boost": 3}}},
                        {"match": {"m_attacker": {"query": query, "operator": "and", "boost": 3}}},
                        {"match": {"m_username": {"query": query, "operator": "and", "boost": 3}}},
                        {"match": {"m_title": {"query": query, "operator": "and", "boost": 2}}},
                        {"match": {"m_content": {"query": query, "operator": "and"}}},
                    ],
                    "minimum_should_match": 1,
                }
            },
            "sort": [
                {"m_date": {"order": "desc", "unmapped_type": "date"}},
                {"m_creation_date": {"order": "desc", "unmapped_type": "date"}},
                {"_score": {"order": "desc"}},
            ],
        }

        success, documents = await elastic_controller.get_instance().search_query(ELASTIC_INDEX.S_SOCIAL_INDEX, data_filter)
        if not success:
            return {"Result": [], "Total_Hits": 0}

        body = documents.body if hasattr(documents, "body") else documents
        hits = (body or {}).get("hits", {}).get("hits", [])
        total = (body or {}).get("hits", {}).get("total", 0)
        total_hits = total.get("value", 0) if isinstance(total, dict) else int(total or 0)
        results = []
        for rank, hit in enumerate(hits, start=1):
            source = dict(hit.get("_source", {}) or {})
            source.pop("m_embedding", None)
            source["_id"] = hit.get("_id", "")
            source["_score"] = hit.get("_score", 0)
            source["_rank"] = rank
            source["rank_index"] = ELASTIC_INDEX.S_SOCIAL_INDEX
            results.append(source)

        return {"Result": results, "Total_Hits": total_hits}

    async def search_phone_recon(self, param, current_user=None, request=None):
        return await self.social_search(param, "phone", current_user, request)

    async def search_profile(self, param, current_user=None, request=None):
        return await self.social_search(param, "profile", current_user, request)

    async def search_online_images(self, param, current_user=None, request=None):
        return await self.social_search(param, "online/images", current_user, request)

    async def search_followers(self, param, current_user=None, request=None):
        return await self.social_search(param, "followers", current_user, request)

    async def search_following(self, param, current_user=None, request=None):
        return await self.social_search(param, "following", current_user, request)

    async def search_posts(self, param, current_user=None, request=None):
        return await self.social_search(param, "posts", current_user, request)

    async def search_videos(self, param, current_user=None, request=None):
        return await self.social_search(param, "videos", current_user, request)

    async def search_shorts(self, param, current_user=None, request=None):
        return await self.social_search(param, "shorts", current_user, request)

    async def search_entity(self, param, current_user=None, request=None):
        return await self.social_search(param, "entity", current_user, request)

    async def search_metadata(self, param, current_user=None, request=None):
        return await self.social_search(param, "metadata", current_user, request)

    async def extension_status(self):
        last_error = ""
        try:
            for base_url in self._social_api_base_urls():
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get(self._social_url(base_url, "extensions/status"), headers=self._social_headers(), timeout=20)
                    if response.status_code != 200:
                        return JSONResponse(status_code=response.status_code, content={"online": 0, "extensions": [], "error": "Social extension manager returned an error"})
                    payload = response.json()
                    if isinstance(payload, dict):
                        payload.setdefault("backend_url", base_url)
                    return payload
                except httpx.RequestError as exc:
                    last_error = str(exc)
                    continue
        except Exception:
            return {"online": 0, "extensions": [], "error": "Failed to reach the extension manager"}
        return {"online": 0, "extensions": [], "error": f"Social service unreachable: {last_error}"}

    async def extension_download(self, browser: str = "chrome"):
        last_error = ""
        try:
            normalized_browser = browser.strip().lower()
            if normalized_browser in {"firefox", "mozilla"}:
                path = "extensions/download/firefox"
                filename = "Orion-Extension-Firefox.zip"
            else:
                path = "extensions/download/chrome"
                filename = "Orion-Extension-Chrome.zip"
            for base_url in self._social_api_base_urls():
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get(self._social_url(base_url, path), headers=self._social_headers(), timeout=60)
                except httpx.RequestError as exc:
                    last_error = str(exc)
                    continue
                if response.status_code != 200:
                    return JSONResponse(status_code=response.status_code, content={"detail": "Extension download failed"})
                return Response(
                    content=response.content,
                    media_type="application/zip",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'},
                )
        except Exception:
            return JSONResponse(status_code=500, content={"detail": "Extension download failed"})
        return JSONResponse(status_code=502, content={"detail": "Social service unreachable", "error": last_error})

    async def search_image(self, payload: dict, current_user=None, request=None):
        image_base64 = payload.get("image_base64")
        if not image_base64:
            return {"status": "error", "message": "image_base64_required"}

        if not isinstance(image_base64, str):
            raise HTTPException(status_code=400, detail="Invalid image_base64")
        image_base64 = image_base64.strip()
        if image_base64.startswith("data:") and "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        if len(image_base64) > self.SOCIAL_IMAGE_MAX_BASE64_LENGTH:
            raise HTTPException(status_code=413, detail="Image too large! Maximum allowed size is 10 MB")

        try:
            file_bytes = base64.b64decode(image_base64, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise HTTPException(status_code=400, detail="Invalid image_base64") from exc
        if len(file_bytes) > self.SOCIAL_IMAGE_MAX_BYTES:
            raise HTTPException(status_code=413, detail="Image too large! Maximum allowed size is 10 MB")

        return await self.social_search({"file_bytes": file_bytes, "filename": "upload.png"}, "recon/image", current_user, request)

    async def append_social_profiles(self, user_id: str, profile_username: str, profiles: list[dict], replace: bool = False):
        try:
            normalized_username = self._normalize_username(profile_username)
            if not normalized_username:
                return JSONResponse(status_code=400, content={"detail": "profile_username is required"})
            if not isinstance(profiles, list):
                return JSONResponse(status_code=400, content={"detail": "profiles must be a list"})

            now_utc = datetime.now(UTC)
            normalized_profiles = []
            for profile in profiles:
                if not isinstance(profile, dict):
                    continue
                normalized_profiles.append({
                    **profile,
                    "keyUsername": normalized_username,
                })

            if normalized_profiles:
                update_doc = {
                    "$setOnInsert": {
                        "user_id": user_id,
                        "profile_username": normalized_username,
                        "created_at": now_utc,
                    },
                    "$set": {"updated_at": now_utc},
                }
                if replace:
                    update_doc["$set"]["profiles"] = normalized_profiles
                else:
                    update_doc["$push"] = {"profiles": {"$each": normalized_profiles}}

                await self._engine.get_collection(db_social_model).update_one(
                    {"user_id": user_id, "profile_username": normalized_username},
                    update_doc,
                    upsert=True,
                )

            return {
                "user_id": user_id,
                "profile_username": normalized_username,
                "saved": len(normalized_profiles),
            }

        except Exception:
            return JSONResponse(status_code=500, content={"detail": "Failed to save social profiles"})

    async def get_social_profiles(self, user_id: str, profile_username: str | None = None):
        try:
            collection = self._engine.get_collection(db_social_model)
            query = {"user_id": user_id}
            normalized_username = self._normalize_username(profile_username or "")
            if normalized_username:
                query = {
                    "user_id": user_id,
                    "$or": [
                        {"profile_username": normalized_username},
                        {"root_username": normalized_username},
                    ],
                }
            rows = []
            cursor = collection.find(query).sort("updated_at", -1)
            async for row in cursor:
                rows.append(row)
            documents = self._merge_profile_documents(rows)
            if normalized_username:
                return documents[0] if documents else {"user_id": user_id, "profile_username": normalized_username, "profiles": []}
            return {"result": documents}

        except Exception:
            return JSONResponse(status_code=500, content={"detail": "Failed to fetch social profiles"})

    async def delete_social_profiles(self, user_id: str, profile_username: str):
        try:
            normalized_username = self._normalize_username(profile_username)
            result = await self._engine.get_collection(db_social_model).delete_many({
                "user_id": user_id,
                "$or": [
                    {"profile_username": normalized_username},
                    {"root_username": normalized_username},
                ],
            })
            return {"profile_username": normalized_username, "deleted": result.deleted_count}

        except Exception:
            return JSONResponse(status_code=500, content={"detail": "Failed to delete social profile data"})
