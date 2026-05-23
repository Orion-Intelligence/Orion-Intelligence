from pathlib import Path
from uuid import uuid4

from cryptography.fernet import Fernet
from fastapi import HTTPException, UploadFile

RESOURCE_DIR = Path("backend/static/resources")
RESOURCE_DIR.mkdir(parents=True, exist_ok=True)

SCREENSHOT_ALLOWED = {"image/png"}

FILE_ALLOWED = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def validate_artifact_file(artifact_type: str, file: UploadFile) -> None:
    if artifact_type == "screenshot":
        if file.content_type not in SCREENSHOT_ALLOWED:
            raise HTTPException(status_code=400, detail="Screenshot must be PNG only")
        return

    if artifact_type == "file":
        if file.content_type not in FILE_ALLOWED:
            raise HTTPException(status_code=400, detail="Allowed file types: PDF, JPG, PNG, TXT, DOCX")
        return

    raise HTTPException(status_code=400, detail="This artifact type does not accept file uploads")


async def save_encrypted_artifact_file(file: UploadFile, enc: Fernet) -> tuple[str, int]:
    resource_id = str(uuid4())
    target_path = RESOURCE_DIR / f"{resource_id}.enc"

    raw = await file.read()
    encrypted = enc.encrypt(raw)
    target_path.write_bytes(encrypted)

    return resource_id, len(raw)


def load_decrypted_artifact_file(resource_id: str, enc: Fernet) -> bytes:
    path = RESOURCE_DIR / f"{resource_id}.enc"

    if not path.exists():
        raise HTTPException(status_code=404, detail="Artifact file not found")

    return enc.decrypt(path.read_bytes())


def delete_artifact_file(resource_id: str) -> None:
    if not resource_id:
        return

    path = RESOURCE_DIR / f"{resource_id}.enc"

    if path.exists():
        path.unlink()