from datetime import datetime
from enum import Enum
from odmantic import Model,EmbeddedModel, Field
from typing import Dict, List


class alert_status(str, Enum):
    IGNORE = "ignore"
    ACTIVE = "active"

class alert_all_ioc(EmbeddedModel):
    name:str=''
    values:List[str]=Field(default_factory=list)

class AlertModel(EmbeddedModel):
    alert_id: str=''
    type: str=''                 
    ioc_type: str = ''    
    ioc_value: str = ''
    data_hash: str = '' 
    title:str=''
    description:str=''
    source:str=''
    url:str=''
    all_ioc:List[alert_all_ioc]
    content_types:List[str]=Field(default_factory=list)
    status: alert_status = Field(default=alert_status.ACTIVE)
    first_seen: datetime= Field(default=datetime.utcnow)
    last_seen: datetime = Field(default=datetime.utcnow)

class db_alert_model(Model):
    userId:str=''
    alerts: List[AlertModel] = Field(default_factory=list)