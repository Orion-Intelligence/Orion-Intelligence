import uuid
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve


class notification_routes_direct_access(MiddlewareMixin):
  @staticmethod
  def process_request(request):
    applicable_routes = ['cms_login', 'cms', 'manage_status', 'manage_search', 'dashboard', 'manage_authentication', 'cms_logout']

    current_route = resolve(request.path_info).url_name
    if current_route in applicable_routes:
      session_token = request.session.get('session_token')
      browser_token = request.COOKIES.get('browser_session_token')

      if not session_token:
        session_token = uuid.uuid4().hex
        request.session['session_token'] = session_token

      if not browser_token or session_token != browser_token:
        request.session.flush()
        request.session['session_token'] = session_token

      request.session.modified = True

  @staticmethod
  def process_response(request, response):
    applicable_routes = ['cms_login', 'cms', 'manage_status', 'manage_search', 'dashboard', 'manage_authentication', 'cms_logout']

    current_route = resolve(request.path_info).url_name

    if current_route in applicable_routes:
      session_token = request.session.get('session_token')
      response.set_cookie('browser_session_token', session_token, max_age=600)

    return response
