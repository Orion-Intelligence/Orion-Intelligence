from typing import Dict

from pydantic import BaseModel, Field


class search_dynamic_param_model(BaseModel):
    text: Dict[str, str] = Field(
        default_factory=dict, examples=[{"username": "", "email": "msmannan00@gmail.com"}])


class search_dynamic_crack_model(BaseModel):
    text: Dict[str, str] = Field(
        default_factory=dict, examples=[{"name": "https://play.google.com/store/apps/details?id=com.jrzheng.supervpnfree&hl=en"}])


class search_dynamic_social_model(BaseModel):
    text: Dict[str, str] = Field(
        default_factory=dict, examples=[{"username": "bitcoin"}])


class search_dynamic_onion_search(BaseModel):
    text: Dict[str, str] = Field(
        default_factory=dict,
        examples=[{"query": "ibrahim"}]
    )


class search_dynamic_crypto_model(BaseModel):
    text: Dict[str, str] = Field(
        default_factory=dict,
        examples=[{
            "wallet": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            "hash": "685b826d9726bcb2e287abb47a24f575aefe6fec7ccb2fa6304ebc11ea2b0842"
        }]
    )