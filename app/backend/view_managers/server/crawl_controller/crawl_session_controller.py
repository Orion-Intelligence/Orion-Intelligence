import json

from backend.view_managers.server.crawl_controller.class_model.crawl_model import crawl_model
from backend.view_managers.server.crawl_controller.crawl_enums import CRAWL_PARAM


class crawl_session_controller:

  # Helper Methods

  @staticmethod
  def init_parameters(p_body):
    m_crawl_model = crawl_model()
    try:
      data = p_body
    except json.JSONDecodeError:
      return False, m_crawl_model,

    if CRAWL_PARAM.M_CRAWL_REQUEST_COMMAND in data:
      m_crawl_model.m_command = int(data[CRAWL_PARAM.M_CRAWL_REQUEST_COMMAND])
    if CRAWL_PARAM.M_CRAWL_REQUEST_DATA in data:
      m_crawl_model.m_data = data[CRAWL_PARAM.M_CRAWL_REQUEST_DATA]

    if m_crawl_model.m_command is None or m_crawl_model.m_data is None:
      return False, m_crawl_model
    else:
      return True, m_crawl_model

