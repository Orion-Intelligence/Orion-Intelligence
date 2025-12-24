from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from orion.services.mongo_manager.shared_model.db_url_data_model import db_url_data_model


class directory_callback_link(BaseModel):
  url: str
  content_type: List[str]
  index_type: List[str]
  leak_model_last_update: Optional[datetime]
  geneic_model_last_update: Optional[datetime]
  network_type: Optional[str]
  name: Optional[str]

  @classmethod
  def from_odmantic(cls, odmantic_doc: db_url_data_model):
    return cls.model_validate(odmantic_doc.model_dump(by_alias=True, exclude={"id"}))


class directory_callback_model(BaseModel):
  total_count: int
  page: int
  mDirectoryCallbackLinks: List[directory_callback_link]
