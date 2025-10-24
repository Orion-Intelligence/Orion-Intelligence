from datetime import datetime
from enum import Enum
from odmantic import Model,EmbeddedModel, Field
from typing import List


class alert_status(str, Enum):
    IGNORE = "ignore"
    ACTIVE = "active"

class AlertModel(EmbeddedModel):
    alert_id: str=''
    type: str=''                 
    ioc_type: str = ''    
    ioc_value: str = ''
    data_hash: str = ''   
    status: alert_status = Field(default=alert_status.ACTIVE)
    first_seen: datetime= Field(default=datetime.utcnow)
    last_seen: datetime = Field(default=datetime.utcnow)

class db_alert_model(Model):
    userId:str=''
    alerts: List[AlertModel] = []