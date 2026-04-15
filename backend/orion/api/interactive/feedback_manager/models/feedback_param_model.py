from pydantic import BaseModel


class feedback_param_model(BaseModel):
    doc_id: str


class feedback_comment_param_model(BaseModel):
    comment: str
