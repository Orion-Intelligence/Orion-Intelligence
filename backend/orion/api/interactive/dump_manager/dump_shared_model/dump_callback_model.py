from datetime import datetime
from typing import List

from pydantic import BaseModel

from orion.services.mongo_manager.shared_model.db_dump_model import db_dump_record_model


class dump_callback_link(BaseModel):
  leak_url: str
  source: str
  group: str
  link: str
  parsed_status: bool
  created_at: datetime

  @classmethod
  def from_odmantic(cls, odmantic_doc: db_dump_record_model):
    return cls.model_validate(odmantic_doc.model_dump(by_alias=True, exclude={"id"}))


class dump_callback_model(BaseModel):
  total_count: int
  page: int
  mDumpCallbackLinks: List[dump_callback_link]
