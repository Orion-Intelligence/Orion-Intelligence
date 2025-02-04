from app.backend.view_managers.interactive.directory_manager.directory_enums import DIRECTORY_MODEL_COMMANDS
from app.backend.view_managers.interactive.directory_manager.directory_view_model import directory_view_model
from app.backend.view_managers.interactive.search_manager.search_enums import SEARCH_MODEL_COMMANDS
from app.backend.view_managers.interactive.search_manager.search_view_model import search_view_model
from app.management.managers.insight_job import insight_job

def get_directory(request):
  return directory_view_model.getInstance().invoke_trigger(DIRECTORY_MODEL_COMMANDS.M_FETCH_LIST, request)

def get_insight(_):
  return insight_job.get_instance().get_trending_insights()

def get_search_result(request):
  return search_view_model.getInstance().invoke_trigger(SEARCH_MODEL_COMMANDS.M_FETCH_RESULT, request)

def get_results(_):
  return None
