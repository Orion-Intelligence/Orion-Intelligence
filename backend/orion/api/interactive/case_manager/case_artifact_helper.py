from curses import raw
from uuid import uuid4
import hashlib
from cryptography.fernet import Fernet
from fastapi import HTTPException, UploadFile

from orion.constants.constant import CONSTANTS


class CaseArtifactHelper:
    def __init__(self):
        self.resource_dir = CONSTANTS.S_CASE_ARTIFACT_RESOURCE_DIR
        self.resource_dir.mkdir(parents=True, exist_ok=True)

    def validate_artifact_file(self, artifact_type: str, file: UploadFile) -> None:
        if artifact_type == "screenshot":
            if file.content_type not in CONSTANTS.S_CASE_ARTIFACT_SCREENSHOT_ALLOWED:
                raise HTTPException(status_code=400, detail="Screenshot must be PNG only")
            return

        if artifact_type == "file":
            if file.content_type not in CONSTANTS.S_CASE_ARTIFACT_FILE_ALLOWED:
                raise HTTPException(status_code=400, detail="Allowed file types: PDF, JPG, PNG, TXT, DOCX")
            return

        raise HTTPException(status_code=400, detail="This artifact type does not accept file uploads")
    
    def generate_sha256_hash(self, raw: bytes) -> str:
        return hashlib.sha256(raw).hexdigest()

    async def save_encrypted_artifact_file(self, file: UploadFile, enc: Fernet) -> tuple[str, int, str]:
        resource_id = str(uuid4())
        target_path = self.resource_dir / f"{resource_id}.enc"

        raw = await file.read()
        file_hash = self.generate_sha256_hash(raw)

        encrypted = enc.encrypt(raw)
        target_path.write_bytes(encrypted)

        return resource_id, len(raw), file_hash
    
    def verify_artifact_file_hash(self, resource_id: str, expected_hash: str, enc: Fernet) -> tuple[bool, str]:
        try:
            raw = self.load_decrypted_artifact_file(resource_id, enc)

            actual_hash = self.generate_sha256_hash(raw)

            return actual_hash == expected_hash, actual_hash

        except Exception as error:
            print("ARTIFACT VERIFY FAILED:", str(error))

            return False, ""

    def load_decrypted_artifact_file(self, resource_id: str, enc: Fernet) -> bytes:
        path = self.resource_dir / f"{resource_id}.enc"

        if not path.exists():
            raise HTTPException(status_code=404, detail="Artifact file not found")

        return enc.decrypt(path.read_bytes())

    def delete_artifact_file(self, resource_id: str) -> None:
        if not resource_id:
            return

        path = self.resource_dir / f"{resource_id}.enc"

        if path.exists():
            path.unlink()
    