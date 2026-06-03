import json
from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from orion.helper_manager.env_handler import env_handler


class TestRouteHelper:
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
