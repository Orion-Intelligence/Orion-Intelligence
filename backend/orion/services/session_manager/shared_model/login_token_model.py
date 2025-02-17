from pydantic import BaseModel


class login_token_model(BaseModel):
    username: str
    password: str
