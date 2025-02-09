from backend.view_managers.interactive.search_manager.parsers.dynamic_parser import dynamic_parser
from backend.view_managers.interactive.search_manager.parsers.static_parser import static_parser
from backend.view_managers.interactive.search_manager.search_data_model.query_model import query_model


class search_session_controller:

  def __init__(self):
    self.__static_parser = static_parser()
    self.__dynamic_parser = dynamic_parser()

  def init_static_callback(self, p_document_list, p_search_model: query_model, total_pages):
    return self.__static_parser.init_callback(p_document_list, p_search_model, total_pages)

  def init_dynamic_callback(self, p_document_list, p_status, p_search_model):
    return self.__static_parser.init_callback(p_document_list, p_status, p_search_model)

