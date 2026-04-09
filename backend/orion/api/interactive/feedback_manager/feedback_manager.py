from datetime import UTC, datetime, timedelta

from fastapi import HTTPException

from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_document_feedback_model import (
    FeedbackTrustState,
    DocumentFeedbackComment,
    DocumentFeedbackReaction,
    db_document_feedback_model,
)


class FeedbackManager:
    __instance = None

    @staticmethod
    def get_instance():
        if FeedbackManager.__instance is None:
            FeedbackManager.__instance = FeedbackManager()
        return FeedbackManager.__instance

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        if FeedbackManager.__instance is not None:
            raise Exception("This class is a singleton!")
        FeedbackManager.__instance = self

    @staticmethod
    def _serialize_comment(comment: DocumentFeedbackComment) -> dict:
        return {
            "user_id": comment.user_id,
            "username": comment.username,
            "tenant_id": comment.tenant_id,
            "comment": comment.comment,
            "created_at": comment.created_at.isoformat(),
            "updated_at": comment.updated_at.isoformat(),
        }

    @staticmethod
    def _serialize_reaction(reaction: DocumentFeedbackReaction) -> dict:
        return {
            "user_id": reaction.user_id,
            "username": reaction.username,
            "tenant_id": reaction.tenant_id,
            "recommended": reaction.recommended,
            "trust_state": reaction.trust_state.value if reaction.trust_state else None,
            "created_at": reaction.created_at.isoformat(),
            "updated_at": reaction.updated_at.isoformat(),
        }

    @staticmethod
    def _get_user_reaction(doc: db_document_feedback_model, current_user) -> DocumentFeedbackReaction | None:
        current_user_id = str(getattr(current_user, "id", ""))
        for reaction in doc.reactions:
            if reaction.user_id == current_user_id:
                return reaction
        return None

    @staticmethod
    def _serialize(doc: db_document_feedback_model, current_user=None) -> dict:
        current_user_reaction = FeedbackManager._get_user_reaction(doc, current_user) if current_user else None
        return {
            "doc_id": doc.doc_id,
            "recommended_count": doc.recommended_count,
            "trust_count": doc.trust_count,
            "untrust_count": doc.untrust_count,
            "comments": [FeedbackManager._serialize_comment(comment) for comment in doc.comments],
            "reactions": [FeedbackManager._serialize_reaction(reaction) for reaction in doc.reactions],
            "current_user_reaction": FeedbackManager._serialize_reaction(current_user_reaction) if current_user_reaction else None,
            "can_react": current_user_reaction is None,
            "created_at": doc.created_at.isoformat(),
            "updated_at": doc.updated_at.isoformat(),
        }

    async def _get_or_create(self, doc_id: str) -> db_document_feedback_model:
        doc = await self._engine.find_one(db_document_feedback_model, {"doc_id": doc_id})
        if doc is None:
            doc = db_document_feedback_model(doc_id=doc_id)
        return doc

    async def get_feedback(self, doc_id: str, current_user=None) -> dict:
        doc = await self._get_or_create(doc_id)
        if doc.id is None:
            doc = await self._engine.save(doc)
        return self._serialize(doc, current_user)

    async def _save_reaction(self, doc_id: str, current_user, recommended=False, trust_state: FeedbackTrustState | None = None) -> dict:
        doc = await self._get_or_create(doc_id)
        if doc.id is None:
            doc = await self._engine.save(doc)

        current_user_id = str(current_user.id)
        now = datetime.now(UTC)
        reaction_payload = {
            "user_id": current_user_id,
            "username": getattr(current_user, "username", ""),
            "tenant_id": str(getattr(current_user, "tenant_uuid", "")),
            "recommended": recommended,
            "trust_state": trust_state.value if trust_state else None,
            "created_at": now,
            "updated_at": now,
        }
        inc_payload = {}
        if recommended:
            inc_payload["recommended_count"] = 1
        elif trust_state == FeedbackTrustState.TRUST:
            inc_payload["trust_count"] = 1
        elif trust_state == FeedbackTrustState.UNTRUST:
            inc_payload["untrust_count"] = 1

        await self._engine.get_collection(db_document_feedback_model).update_one(
            {
                "doc_id": doc_id,
                "reactions.user_id": {"$ne": current_user_id},
            },
            {
                "$push": {"reactions": reaction_payload},
                "$inc": inc_payload,
                "$set": {"updated_at": now},
            },
        )
        saved = await self._engine.find_one(db_document_feedback_model, {"doc_id": doc_id})
        if saved is None:
            saved = doc
        return self._serialize(saved, current_user)

    async def increment_recommended(self, doc_id: str, current_user) -> dict:
        return await self._save_reaction(doc_id, current_user, recommended=True)

    async def increment_trust(self, doc_id: str, current_user) -> dict:
        return await self._save_reaction(doc_id, current_user, trust_state=FeedbackTrustState.TRUST)

    async def increment_untrust(self, doc_id: str, current_user) -> dict:
        return await self._save_reaction(doc_id, current_user, trust_state=FeedbackTrustState.UNTRUST)

    async def add_comment(self, doc_id: str, comment: str, current_user) -> dict:
        doc = await self._get_or_create(doc_id)
        now = datetime.now(UTC)
        current_user_id = str(current_user.id)
        one_hour_ago = now - timedelta(hours=1)
        for existing_comment in doc.comments:
            if existing_comment.user_id == current_user_id and existing_comment.created_at >= one_hour_ago:
                raise HTTPException(status_code=429, detail="Only one comment per hour is allowed.")
        doc.comments.insert(0, DocumentFeedbackComment(
            user_id=current_user_id,
            username=getattr(current_user, "username", ""),
            tenant_id=str(getattr(current_user, "tenant_uuid", "")),
            comment=comment.strip(),
            created_at=now,
            updated_at=now,
        ))
        doc.updated_at = now
        saved = await self._engine.save(doc)
        return self._serialize(saved, current_user)
