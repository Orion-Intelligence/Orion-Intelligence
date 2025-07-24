from pydantic import BaseModel


class ScreenshotPayload(BaseModel):
    filename: str
    data: str
