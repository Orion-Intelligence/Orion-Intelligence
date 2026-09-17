from orion.api.interactive.backup_manager.models.tenant_partition_model import Ownership, PartitionRule

TENANT_FIELD_CANDIDATES = ("tenant_id",)
USER_FIELD_CANDIDATES = ("user_id", "user_uuid")
SHARED_MODEL_PACKAGE = "orion.services.mongo_manager.shared_model"

GLOBAL_RULE = PartitionRule(
    ownership=Ownership.GLOBAL,
    source="fallback",
    reason="no tenant or user field could be resolved, excluded from tenant folders and never deleted per tenant",
)

PRESERVED_RULE = PartitionRule(
    ownership=Ownership.PRESERVED,
    source="preserved",
    reason="backup bookkeeping collection",
)

EXPLICIT_RULES: dict[str, PartitionRule] = {
    "db_tenant_model": PartitionRule(
        ownership=Ownership.DIRECT,
        tenant_field="_id",
        as_object_id=True,
        source="explicit",
        reason="the tenant document is identified by its own _id, not by a tenant field",
    ),
    "social": PartitionRule(
        ownership=Ownership.TRANSITIVE,
        user_field="user_id",
        source="explicit",
        reason="raw collection with no odmantic model, owned through the user that captured the profile",
    ),
    "db_document_feedback_model": PartitionRule(
        ownership=Ownership.GLOBAL,
        source="explicit",
        reason="keyed by a global elasticsearch document id, only its embedded reactions belong to tenants",
    ),
}
