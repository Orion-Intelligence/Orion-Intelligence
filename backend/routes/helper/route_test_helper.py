from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

from orion.services.mongo_manager.shared_model.db_scan_job_model import db_scan_job_model
from orion.api.interactive.scan_job_manager.scan_job_manager import ScanJobManager
from bson import ObjectId
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from orion.helper_manager.env_handler import env_handler


class TestRouteHelper:
    __test__ = False

    MOCKS_DIR = Path(__file__).resolve().parents[2] / "static" / "test" / "mocks" / "api"
    ELASTIC_MOCKS_DIR = Path(__file__).resolve().parents[2] / "static" / "test" / "mocks" / "elastic"
    STATIC_TEST_CHAT_RESPONSE = "how may i help you"

    @classmethod
    def mock_step(cls, key: str):
        p = cls.MOCKS_DIR / f".{key}.state"
        p.parent.mkdir(parents=True, exist_ok=True)
        try:
            n = int(p.read_text(encoding="utf-8").strip() or "0")
        except FileNotFoundError:
            n = 0
        except Exception:
            n = 0
        p.write_text(str(n + 1), encoding="utf-8")
        if n == 0:
            return {"status": "pending", "progress": 20, "step": "running"}
        return None

    @classmethod
    def load_elastic_mock(cls, filename: str):
        return json.loads((cls.ELASTIC_MOCKS_DIR / filename).read_text(encoding="utf-8"))

    @classmethod
    def load_api_mock(cls, filename: str):
        return json.loads((cls.MOCKS_DIR / filename).read_text(encoding="utf-8"))

    @classmethod
    def pending_or_api_mock(cls, step_key: str, filename: str):
        step = cls.mock_step(step_key)
        if step:
            return step
        return cls.load_api_mock(filename)

    @classmethod
    def pending_or_elastic_mock(cls, step_key: str, filename: str):
        step = cls.mock_step(step_key)
        if step:
            return step
        return cls.load_elastic_mock(filename)

    @classmethod
    def pending_or_dynamic_scan(cls, scan_type: str | None):
        scan_type = scan_type or "basic"
        step_key = f"urlscan_domain_{scan_type}"
        step = cls.mock_step(step_key)
        if step:
            return step
        filename = f"urlscan_domain_{scan_type}.json"
        return cls.load_api_mock(filename)

    @classmethod
    def scan_job_mock_response(cls, api_reference: str, payload: dict[str, Any]):
        normalized_api = api_reference.strip().lstrip("/").removeprefix("api/")
        if normalized_api in {"urlscan/domain", "urlscan/subdomains", "urlscan/dns", "urlscan/wayback"}:
            return cls.pending_or_dynamic_scan(payload.get("scanType"))
        if normalized_api == "netintel/url_vulnerability_scan":
            return cls.pending_or_dynamic_scan("vulnerability")

        mock_routes = {
            "dynamic/user": ("dynamic_user", "dynamic_user_done.json"),
            "dynamic/social": ("dynamic_social", "dynamic_social.json"),
            "dynamic/wanted": ("dynamic_wanted", "dynamic_wanted.json"),
            "dynamic/cracked": ("dynamic_cracked", "dynamic_cracked.json"),
            "dynamic/software": ("dynamic_software", "dynamic_software.json"),
            "dynamic/national-identity": ("dynamic_national_identity", "dynamic_national_identity.json"),
            "crypto/scan": ("dynamic_crypto_scan", "dynamic_crypto_scan.json"),
            "ioc/extract": ("ioc_file_extract", "ioc_file_extract.json"),
            "apk/scan": ("ioc_apk_extract", "ioc_apk_extract.json"),
            "netintel/resolve_ip": ("netintel_resolve_ip", "netintel_resolve_ip.json"),
            "netintel/ipscanner": ("netintel_ipscanner", "netintel_ipscanner.json"),
            "netintel/iot_detect": ("netintel_camera_detect", "netintel_camera_detect.json"),
            "netintel/camera_detect_ranges": ("netintel_camera_detect", "netintel_camera_detect_ranges.json"),
        }
        if normalized_api in mock_routes:
            step_key, filename = mock_routes[normalized_api]
            return cls.pending_or_api_mock(step_key, filename)
        if normalized_api == "nexus/analyze-text":
            return cls.load_api_mock("nexus_analyze_text.json")
        return {"status": "done", "step": "complete", "result": {}}

    async def test_poll_scan_job(scan_id: str, current_user):
        manager = ScanJobManager.get_instance()

        job = await manager._engine.find_one(db_scan_job_model, (db_scan_job_model.id == ObjectId(scan_id)) & (db_scan_job_model.user_uuid == str(current_user.id)))
        if not job:
            raise HTTPException(status_code=404, detail="Scan job not found")

        response = job.response or {}
        scan_status = manager._job_status_from_response(response) if response else None
        if not scan_status or not manager.is_terminal_status(scan_status.value):
            now = datetime.now(timezone.utc)
            mock_response = TestRouteHelper.scan_job_mock_response(job.api_reference, job.payload or {})
            job.response = mock_response if isinstance(mock_response, dict) else {"result": mock_response}
            job.updated_at = now
            computed_status = manager._job_status_from_response(job.response)
            if computed_status.value in {"done", "error"}:
                job.completed_at = now
            await manager._engine.save(job)

        return manager._build_poll_response(job)

    @classmethod
    def static_test_chat_response(cls):
        return {"result": {"response": cls.STATIC_TEST_CHAT_RESPONSE}, "status": "done"}

    @classmethod
    async def static_test_chat_stream(cls):
        yield json.dumps(
            {
                "output": {"response": cls.STATIC_TEST_CHAT_RESPONSE},
                "done": True,
                "error": False,
            },
            ensure_ascii=True,
        ) + "\n"

    @classmethod
    def static_test_chat_streaming_response(cls):
        return StreamingResponse(
            cls.static_test_chat_stream(),
            media_type="application/x-ndjson",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    @staticmethod
    def require_testing_enabled():
        if env_handler.get_instance().env("TESTING_ENABLED", "0") != "1":
            raise HTTPException(status_code=403, detail="Test routes are disabled")
        return True
