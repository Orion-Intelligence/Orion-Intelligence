from __future__ import annotations

from typing import Any


class FakeArtifactFileHelper:
    def __init__(self, verify_result: bool = True, file_data: bytes = b"payload"):
        self.verify_result = verify_result
        self.file_data = file_data
        self.validate_count_calls = []
        self.validate_file_calls = []
        self.saved = []
        self.loaded = []
        self.deleted = []
        self.verify_calls = []
        self.save_counter = 0

    def validate_file_count(self, files) -> None:
        self.validate_count_calls.append(len(files))

    def validate_artifact_file(self, artifact_type: str, file: Any) -> None:
        self.validate_file_calls.append((artifact_type, file))

    async def save_encrypted_artifact_file(self, file: Any, enc: Any):
        self.save_counter += 1
        resource_id = f"resource-{self.save_counter}"
        self.saved.append((file, enc, resource_id))
        return resource_id, 123, f"hash-{self.save_counter}"

    def load_decrypted_artifact_file(self, resource_id: str, enc: Any) -> bytes:
        self.loaded.append((resource_id, enc))
        return self.file_data

    def verify_artifact_file_hash(self, resource_id: str, expected_hash: str, enc: Any) -> bool:
        self.verify_calls.append((resource_id, expected_hash, enc))
        return self.verify_result

    def delete_artifact_file(self, resource_id: str) -> None:
        self.deleted.append(resource_id)


class FakeSearchManager:
    def __init__(self, result=None):
        self.result = result if result is not None else {"Result": []}
        self.calls = []

    def getInstance(self):
        return self

    async def search_consolidated_ranked_result(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        return self.result
