from typing import Any

from pydantic import BaseModel


class NexusRpcParams(BaseModel):
    name: str
    arguments: dict[str, Any]


class NexusRpcPayloadModel(BaseModel):
    jsonrpc: str = "2.0"
    id: str
    method: str
    params: NexusRpcParams | dict[str, Any]

    @classmethod
    def tool_call(cls, request_id: str, name: str, arguments: dict[str, Any]):
        return cls(id=request_id, method="tools/call", params=NexusRpcParams(name=name, arguments=arguments))

    @classmethod
    def tool_cancel(cls, request_id: str, user_id: str):
        return cls(id=request_id, method="tools/cancel", params={"user_id": user_id})

    @classmethod
    def tool_resume(cls, request_id: str, user_id: str):
        return cls(id=request_id, method="tools/resume", params={"user_id": user_id})
