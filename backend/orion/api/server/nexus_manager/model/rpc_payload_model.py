from typing import Any

from pydantic import BaseModel


class NexusRpcPayloadModel(BaseModel):
    jsonrpc: str = "2.0"
    id: str
    method: str
    params: dict[str, Any]

    @classmethod
    def tool_call(cls, request_id: str, name: str, arguments: dict[str, Any]):
        return cls(id=request_id, method="tools/call", params={"name": name, "arguments": arguments, "_meta": {"progressToken": request_id}})
