from datetime import UTC, datetime, timedelta

from bson import ObjectId
from fastapi import HTTPException
from cryptography.fernet import Fernet

from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
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
    async def _get_tenant_id_for_user_id(user_id: str) -> str:
        if not user_id:
            return ""
        try:
            user = await mongo_controller.get_instance().get_engine().find_one(db_user_account, db_user_account.id == ObjectId(user_id))
        except Exception:
            return ""
        return str(getattr(user, "tenant_uuid", "") or "") if user else ""

    @staticmethod
    async def _serialize_comment(comment: DocumentFeedbackComment) -> dict:
        decrypted_comment = ""
        tenant_id = await FeedbackManager._get_tenant_id_for_user_id(str(getattr(comment, "user_id", "") or ""))
        if tenant_id and comment.comment:
            try:
                dek = await KeyManager.get_instance().get_or_create_dek(tenant_id)
                decrypted_comment = Fernet(dek).decrypt(comment.comment.encode()).decode()
            except Exception:
                decrypted_comment = ""
        return {
            "user_id": comment.user_id,
            "username": comment.username,
            "comment": decrypted_comment,
            "created_at": comment.created_at.isoformat(),
            "updated_at": comment.updated_at.isoformat(),
        }

    @staticmethod
    def _serialize_reaction(reaction: DocumentFeedbackReaction) -> dict:
        return {
            "user_id": reaction.user_id,
            "username": reaction.username,
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
    async def _serialize(doc: db_document_feedback_model, current_user=None) -> dict:
        current_user_reaction = FeedbackManager._get_user_reaction(doc, current_user) if current_user else None
        return {
            "doc_id": doc.doc_id,
            "recommended_count": doc.recommended_count,
            "trust_count": doc.trust_count,
            "untrust_count": doc.untrust_count,
            "comments": [await FeedbackManager._serialize_comment(comment) for comment in doc.comments],
            "reactions": [FeedbackManager._serialize_reaction(reaction) for reaction in doc.reactions],
            "current_user_reaction": FeedbackManager._serialize_reaction(current_user_reaction) if current_user_reaction else None,
            "can_react": True,
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
        return await self._serialize(doc, current_user)

    async def _save_reaction(self, doc_id: str, current_user, recommended=False, trust_state: FeedbackTrustState | None = None) -> dict:
        doc = await self._get_or_create(doc_id)
        if doc.id is None:
            doc = await self._engine.save(doc)

        now = datetime.now(UTC)
        existing_reaction = self._get_user_reaction(doc, current_user)
        if existing_reaction is None:
            existing_reaction = DocumentFeedbackReaction(
                user_id=str(current_user.id),
                username=getattr(current_user, "username", ""),
                recommended=False,
                trust_state=None,
                created_at=now,
                updated_at=now,
            )
            doc.reactions.append(existing_reaction)

        existing_reaction.username = getattr(current_user, "username", "")

        if recommended:
            if existing_reaction.recommended:
                existing_reaction.recommended = False
                doc.recommended_count = max(0, doc.recommended_count - 1)
            else:
                existing_reaction.recommended = True
                doc.recommended_count += 1

        if trust_state == FeedbackTrustState.TRUST:
            if existing_reaction.trust_state == FeedbackTrustState.TRUST:
                existing_reaction.trust_state = None
                doc.trust_count = max(0, doc.trust_count - 1)
            else:
                if existing_reaction.trust_state == FeedbackTrustState.UNTRUST:
                    doc.untrust_count = max(0, doc.untrust_count - 1)
                existing_reaction.trust_state = FeedbackTrustState.TRUST
                doc.trust_count += 1

        if trust_state == FeedbackTrustState.UNTRUST:
            if existing_reaction.trust_state == FeedbackTrustState.UNTRUST:
                existing_reaction.trust_state = None
                doc.untrust_count = max(0, doc.untrust_count - 1)
            else:
                if existing_reaction.trust_state == FeedbackTrustState.TRUST:
                    doc.trust_count = max(0, doc.trust_count - 1)
                existing_reaction.trust_state = FeedbackTrustState.UNTRUST
                doc.untrust_count += 1

        if not existing_reaction.recommended and existing_reaction.trust_state is None:
            doc.reactions = [reaction for reaction in doc.reactions if reaction.user_id != existing_reaction.user_id]
        else:
            existing_reaction.updated_at = now

        doc.updated_at = now
        saved = await self._engine.save(doc)
        return await self._serialize(saved, current_user)

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
        encrypted_comment = comment.strip()
        tenant_id = await self._get_tenant_id_for_user_id(current_user_id)
        if tenant_id and encrypted_comment:
            dek = await KeyManager.get_instance().get_or_create_dek(tenant_id)
            encrypted_comment = Fernet(dek).encrypt(encrypted_comment.encode()).decode()
        doc.comments.insert(0, DocumentFeedbackComment(
            user_id=current_user_id,
            username=getattr(current_user, "username", ""),
            comment=encrypted_comment,
            created_at=now,
            updated_at=now,
        ))
        doc.updated_at = now
        saved = await self._engine.save(doc)
        return await self._serialize(saved, current_user)
