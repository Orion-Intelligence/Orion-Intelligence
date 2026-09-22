from pydantic import BaseModel


class feedback_comment_param_model(BaseModel):
    comment: str
