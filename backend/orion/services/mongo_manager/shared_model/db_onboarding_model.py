from odmantic import Model,EmbeddedModel
from typing import Dict, Any, List

class IocCategory(EmbeddedModel):
    ioc_id: str
    name: str
    values: List[str]

class db_onboarding_model(Model):
    companyName: str
    iocs: List[IocCategory]
    userId:str

class OnboardingRequest(Model):
    companyName: str
    iocs: List[IocCategory]