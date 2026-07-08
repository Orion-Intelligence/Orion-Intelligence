import json
from typing import Any


class ResponseParser:
    @staticmethod
    def to_dict(
        response: Any,
        *,
        allow_body: bool = True,
        allow_model_dump: bool = True,
        allow_dict_method: bool = True,
    ) -> dict | None:
        if isinstance(response, dict):
            return response

        if allow_body and hasattr(response, "body"):
            body = response.body
            if isinstance(body, bytes):
                body = body.decode()
            return json.loads(body)

        if allow_model_dump and hasattr(response, "model_dump"):
            return response.model_dump()

        if allow_dict_method and hasattr(response, "dict"):
            return response.dict()

        return None
