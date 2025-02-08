import datetime
from backend.helper_manager.helper_controller import helper_controller
from backend.services.mongo_manager.mongo_enums import MONGODB_KEYS, MONGODB_COLLECTIONS
from datetime import datetime, timezone


class mongo_request_generator:

  def __init__(self):
    pass

  @staticmethod
  def on_update_url_status(url, url_status=None, leak_status=None, content_type=None, network_type=None):
    url = helper_controller.normalize_url(url)

    update_values = {"url": url}
    utc_now = datetime.now(timezone.utc)
    current_date = utc_now

    if url_status is not None:
      update_values["url_status_date"] = current_date

    if leak_status is not None:
      update_values["leak_status_date"] = current_date
      update_values["index"] = "monitor"
    else:
      update_values["index"] = "general"

    if content_type is not None:
      update_values["content_type"] = content_type

    if network_type is not None:
      update_values["network_type"] = network_type

    return MONGODB_COLLECTIONS.S_URL_STATUS, {"url": url},  {"$set": update_values}

  @staticmethod
  def on_fetch_url_status(p_content_type=None, p_index=None, p_network=None):
    query_filter = {}

    if p_content_type and p_content_type.lower() != "all":
      content_type_list = [ctype.strip() for ctype in p_content_type.split(',') if ctype.strip()]
      query_filter["content_type"] = {"$elemMatch": {"$in": content_type_list}}

    if p_index and p_index.lower() != "all":
      query_filter["index"] = {"$eq": p_index}

    if p_network and p_network.lower() != "all":
      query_filter["network_type"] = {"$eq": p_network}

    return MONGODB_COLLECTIONS.S_URL_STATUS, query_filter
