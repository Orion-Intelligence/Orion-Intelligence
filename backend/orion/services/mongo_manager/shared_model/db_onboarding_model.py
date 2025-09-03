from odmantic import Model,EmbeddedModel
from typing import List

class IocCategory(EmbeddedModel):
    ioc_id: str
    name: str
    values: List[str]

    def __str__(self):
        return f"{self.name} ({len(self.values)} values)"

class db_onboarding_model(Model):
    companyName: str
    iocs: List[IocCategory]
    userId:str=""

class OnboardingRequest(Model):
    companyName: str
    iocs: List[IocCategory]