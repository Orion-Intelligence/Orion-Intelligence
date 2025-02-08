from django.views.decorators.csrf import csrf_exempt
from app.backend.view_managers.interactive.directory_manager.directory_view_model import directory_view_model
from app.backend.view_managers.interactive.hompage_manager.homepage_enums import HOMEPAGE_MODEL_COMMANDS
from app.backend.view_managers.interactive.hompage_manager.homepage_view_model import homepage_view_model
from app.backend.view_managers.interactive.search_manager.search_enums import SEARCH_MODEL_COMMANDS
from app.backend.view_managers.interactive.search_manager.search_view_model import search_view_model
from app.backend.view_managers.server.crawl_controller.crawl_controller import crawl_controller
from app.backend.view_managers.server.crawl_controller.crawl_enums import CRAWL_COMMANDS
from app.backend.view_managers.server.error_manager.error_enums import ERROR_MODEL_CALLBACK
from app.services.block_manager.block_controller import block_controller
from app.backend.constants.constant import CONSTANTS
from app.backend.view_managers.server.external_request_manager.external_request_controller import external_request_controller
from app.backend.view_managers.server.external_request_manager.external_request_enums import EXTERNAL_REQUEST_COMMANDS
from app.backend.view_managers.server.block_manager.block_enums import BLOCK_MODEL_CALLBACK
from app.backend.view_managers.server.error_manager.error_view_model import error_view_model
from app.backend.view_managers.interactive.directory_manager.directory_enums import DIRECTORY_MODEL_COMMANDS
from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.models import User

def index(request):
  return error_view_model.getInstance().invoke_trigger(ERROR_MODEL_CALLBACK.M_INIT, [request, 404])


def command(request):
  return homepage_view_model.getInstance().invoke_trigger(HOMEPAGE_MODEL_COMMANDS.M_INIT, request)

def directory(request):
  return directory_view_model.getInstance().invoke_trigger(DIRECTORY_MODEL_COMMANDS.M_INIT, request)


def search(request):
  return search_view_model.getInstance().invoke_trigger(SEARCH_MODEL_COMMANDS.M_INIT, request)


def parser(request):
  return crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_FETCH_PARSER, request)


def feeder_unique(request):
  return crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_FETCH_FEEDER_UNIQUE, request)


def feeder_publish(request):
  return crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_FETCH_FEEDER_PUBLISH, request)


def feeder(request):
  return crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_FETCH_FEEDER, request)


def block(request):
  return block_controller.get_instance().invoke_trigger(BLOCK_MODEL_CALLBACK.M_INIT, request)

@csrf_exempt
def crawl_index(request):
  return crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_INIT, request)

def update_status(request):
  return external_request_controller.getInstance().invoke_trigger(EXTERNAL_REQUEST_COMMANDS.M_UPDATE_MODULE_STATUS, request)


def error_page_400(request, exception=None):
  return error_view_model.getInstance().invoke_trigger(ERROR_MODEL_CALLBACK.M_INIT, [request, 400])


def error_page_403(request, exception=None):
  return error_view_model.getInstance().invoke_trigger(ERROR_MODEL_CALLBACK.M_INIT, [request, 403])


def error_page_404(request, exception, template_name='backend/error_manager/error_manager.html'):
  return error_view_model.getInstance().invoke_trigger(ERROR_MODEL_CALLBACK.M_INIT, [request, 404])


def error_page_500(request, exception=None):
  return error_view_model.getInstance().invoke_trigger(ERROR_MODEL_CALLBACK.M_INIT, [request, 500])


def custom_login(request):
  if request.method == 'POST':
    password = request.POST.get('password')
    demo_user = User.objects.filter(username='demo').first()

    if demo_user and demo_user.check_password(password):
      login(request, demo_user)
      return redirect('home')

  return render(request, CONSTANTS.S_TEMPLATE_LOGIN_PATH)
