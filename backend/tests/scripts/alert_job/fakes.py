from __future__ import annotations

from bson import ObjectId


class _FakeAlertBuffer:
    def __init__(self):
        self.clear_calls = []
        self.flush_calls = []

    def clear(self, tenant_id):
        self.clear_calls.append(tenant_id)

    async def flush(self, tenant_id):
        self.flush_calls.append(tenant_id)
        return {"total": 0}


class _FakeAlertManager:
    def __init__(self, running=False):
        self.running = running
        self.status_calls = []
        self.running_calls = []
        self.tenant_mail_calls = []
        self.admin_mail_calls = []

    def getInstance(self):
        return self

    async def get_scan_status_by_tenant_id(self, tenant_id):
        self.status_calls.append(tenant_id)
        return {"scan_running": self.running}

    async def set_scan_running(self, tenant_id, value):
        self.running_calls.append((tenant_id, value))
        self.running = value
        return {"tenant_id": tenant_id, "scan_running": value}

    async def send_scan_completed_mail(self, **kwargs):
        self.tenant_mail_calls.append(kwargs)
        return True

    async def send_admin_scan_summary_mail(self, compromised_tenants):
        self.admin_mail_calls.append(compromised_tenants)
        return True


class _FakeUpdateResult:
    def __init__(self, modified_count=0):
        self.modified_count = modified_count


class _FakeSchedulerCollection:
    def __init__(self, docs):
        self.docs = docs

    async def find_one(self, query):
        for doc in self.docs:
            if self._matches(doc, query):
                return doc
        return None

    async def update_many(self, query, update):
        modified_count = 0
        for doc in self.docs:
            if self._matches(doc, query):
                doc.update(update["$set"])
                modified_count += 1
        return _FakeUpdateResult(modified_count)

    async def update_one(self, query, update, upsert=False):
        for doc in self.docs:
            if self._matches(doc, query):
                doc.update(update.get("$set", {}))
                return _FakeUpdateResult(1)
        if upsert:
            doc = dict(query)
            doc.update(update.get("$setOnInsert", {}))
            doc["_id"] = ObjectId()
            self.docs.append(doc)
        return _FakeUpdateResult(0)

    async def find_one_and_update(self, query, update, **_kwargs):
        for doc in self.docs:
            if self._matches(doc, query):
                doc.update(update["$set"])
                return doc
        return None

    @staticmethod
    def _matches(doc, query):
        for key, value in query.items():
            if isinstance(value, dict) and "$in" in value:
                if doc.get(key) not in value["$in"]:
                    return False
            elif isinstance(value, dict) and "$lte" in value:
                if doc.get(key) > value["$lte"]:
                    return False
            elif doc.get(key) != value:
                return False
        return True
