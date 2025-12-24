from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.constants.strings import SEARCH_STRINGS


class query_model:
  m_total_documents = 1
  m_search_param_model: search_leak_param_model = None

  def set_search_type(self, p_search_type):
    if p_search_type != "all" and p_search_type != "forums" and p_search_type != "marketplaces" and p_search_type != "news":
      self.m_search_param_model.pSearchParamType = SEARCH_STRINGS.S_SEARCH_TYPE_PARAM
    else:
      self.m_search_param_model.pSearchParamType = p_search_type

  def set_total_documents(self, p_total_document):
    try:
      self.m_total_documents = int(p_total_document)
    except Exception:
      self.m_total_documents = 1
