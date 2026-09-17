from __future__ import annotations

import importlib
import pkgutil

from orion.api.interactive.backup_manager.constants.constant import (
    EXPLICIT_RULES,
    GLOBAL_RULE,
    PRESERVED_RULE,
    SHARED_MODEL_PACKAGE,
    TENANT_FIELD_CANDIDATES,
    USER_FIELD_CANDIDATES,
)
from orion.api.interactive.backup_manager.models.tenant_partition_model import (
    Ownership,
    PartitionRule,
    TenantScope,
)
from orion.services.log_manager.log_controller import log


class TenantPartitionRegistry:

    def __init__(self, preserved: set[str] | None = None):
        self._preserved = set(preserved or ())
        self._model_fields = self._discover_model_fields()
        self._cache: dict[str, PartitionRule] = {}

    @staticmethod
    def _discover_model_fields() -> dict[str, set[str]]:
        discovered: dict[str, set[str]] = {}
        try:
            from odmantic import Model

            package = importlib.import_module(SHARED_MODEL_PACKAGE)
            for module in pkgutil.iter_modules(package.__path__):
                try:
                    importlib.import_module(f"{SHARED_MODEL_PACKAGE}.{module.name}")
                except Exception as exc:
                    log.g().w(f"TENANT PARTITION: could not import model module {module.name}: {exc}")

            pending = [Model]
            while pending:
                current = pending.pop()
                for subclass in current.__subclasses__():
                    pending.append(subclass)
                    collection = getattr(subclass, "__collection__", None)
                    if collection:
                        discovered[collection] = set(getattr(subclass, "model_fields", {}) or {})
        except Exception as exc:
            log.g().e(f"TENANT PARTITION: model discovery failed, falling back to explicit rules only: {exc}")
        return discovered

    @staticmethod
    def _infer_rule(fields: set[str]) -> PartitionRule | None:
        for candidate in TENANT_FIELD_CANDIDATES:
            if candidate in fields:
                return PartitionRule(
                    ownership=Ownership.DIRECT,
                    tenant_field=candidate,
                    reason=f"model declares {candidate}",
                )
        for candidate in USER_FIELD_CANDIDATES:
            if candidate in fields:
                return PartitionRule(
                    ownership=Ownership.TRANSITIVE,
                    user_field=candidate,
                    reason=f"model declares {candidate}",
                )
        return None

    def rule_for(self, collection_name: str) -> PartitionRule:
        cached = self._cache.get(collection_name)
        if cached is not None:
            return cached

        if collection_name in self._preserved:
            resolved = PRESERVED_RULE
        elif collection_name in EXPLICIT_RULES:
            resolved = EXPLICIT_RULES[collection_name]
        else:
            resolved = self._infer_rule(self._model_fields.get(collection_name, set())) or GLOBAL_RULE

        self._cache[collection_name] = resolved
        return resolved

    def tenant_owned(self, collection_names) -> dict[str, PartitionRule]:
        owned = {}
        for name in collection_names:
            rule = self.rule_for(name)
            if rule.is_tenant_owned:
                owned[name] = rule
        return owned

    def describe(self, collection_names) -> dict[str, dict]:
        summary = {}
        for name in collection_names:
            rule = self.rule_for(name)
            summary[name] = {
                "ownership": rule.ownership.value,
                "field": rule.tenant_field or rule.user_field,
                "source": rule.source,
            }
        return summary

    @staticmethod
    def tenant_query(rule: PartitionRule, scope: TenantScope) -> dict | None:
        if rule.ownership == Ownership.DIRECT:
            if rule.as_object_id:
                object_id = scope.object_id
                return None if object_id is None else {"_id": object_id}
            if not scope.tenant_id:
                return None
            return {rule.tenant_field: scope.tenant_id}

        if rule.ownership == Ownership.TRANSITIVE:
            if not scope.user_ids:
                return None
            return {rule.user_field: {"$in": list(scope.user_ids)}}

        return None
