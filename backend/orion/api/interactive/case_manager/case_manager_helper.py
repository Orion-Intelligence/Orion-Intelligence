from datetime import datetime
from datetime import timezone
import hashlib

from cryptography.fernet import Fernet

from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.services.mongo_manager.shared_model.db_case_model import CaseEntity
from orion.services.mongo_manager.shared_model.db_case_model import db_case_model


def actor_id(current_user) -> str:
    return str(current_user.id)


def is_admin(current_user) -> bool:
    role = getattr(current_user.role, "value", str(current_user.role))
    return role == user_role.ADMIN.value


def is_maintainer(current_user) -> bool:
    licenses = {
        getattr(license_value, "value", str(license_value))
        for license_value in (current_user.licenses or [])
    }
    return LicenseName.MAINTAINER.value in licenses


def can_view_case(record: db_case_model, current_user) -> bool:
    current_actor_id = actor_id(current_user)
    return (
        is_maintainer(current_user)
        or record.createdBy == current_actor_id
        or current_actor_id in (record.assignedAnalystIds or [])
    )


def can_manage_case_assignments(record: db_case_model, current_user) -> bool:
    return is_maintainer(current_user) or is_admin(current_user) or record.createdBy == actor_id(current_user)


def can_comment(record: db_case_model, current_user) -> bool:
    current_actor_id = actor_id(current_user)
    return (
        is_maintainer(current_user)
        or is_admin(current_user)
        or record.createdBy == current_actor_id
        or current_actor_id in (record.assignedAnalystIds or [])
    )


def can_close_case(record: db_case_model, current_user) -> bool:
    current_actor_id = actor_id(current_user)
    return is_maintainer(current_user) or is_admin(current_user) or current_actor_id in (record.assignedAnalystIds or [])


def can_share_case(record: db_case_model, current_user) -> bool:
    return is_maintainer(current_user) or is_admin(current_user) or record.createdBy == actor_id(current_user)


def hash_share_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def as_aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


async def get_case_cipher_by_tenant_id(tenant_id: str) -> Fernet:
    dek = await KeyManager.get_instance().get_or_create_dek(tenant_id)
    return Fernet(dek)


async def get_case_cipher(current_user) -> Fernet:
    return await get_case_cipher_by_tenant_id(str(current_user.tenant_uuid))


def encrypt_value(enc: Fernet, value: str) -> str:
    if not value:
        return value
    return enc.encrypt(value.encode()).decode()


def decrypt_value(enc: Fernet, value: str) -> str:
    if not value:
        return value
    try:
        return enc.decrypt(value.encode()).decode()
    except Exception:
        return value


def apply_sensitive_case_values(record: db_case_model, transform) -> None:
    record.title = transform(record.title)
    record.description = transform(record.description)
    for entity in record.entities or []:
        entity.value = transform(entity.value)
        entity.displayName = transform(entity.displayName)
        apply_sensitive_entity_values(entity, transform)
    for artifact in record.artifacts or []:
        artifact.title = transform(artifact.title)
        artifact.description = transform(artifact.description)
        artifact.url = transform(artifact.url)
        artifact.fileName = transform(artifact.fileName)
        artifact.fileType = transform(artifact.fileType)
    for comment in record.comments or []:
        comment.body = transform(comment.body)
    for task in record.tasks or []:
        task.title = transform(task.title)
        task.description = transform(task.description)
    for linked_case in record.linkedCases or []:
        linked_case.reason = transform(linked_case.reason)
    if record.closure:
        record.closure.summary = transform(record.closure.summary)
        record.closure.resolution = transform(record.closure.resolution)


def apply_sensitive_entity_values(entity: CaseEntity, transform) -> None:
    for identifier in entity.identifiers or []:
        identifier.value = transform(identifier.value)
        identifier.issuer = transform(identifier.issuer)
    for profile in entity.socialProfiles or []:
        profile.username = transform(profile.username)
        profile.profileUrl = transform(profile.profileUrl)
        profile.displayName = transform(profile.displayName)
    for attribute in entity.attributes or []:
        attribute.value = transform(attribute.value)
