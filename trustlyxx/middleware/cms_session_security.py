import uuid
from django.utils.deprecation import MiddlewareMixin


class cms_session_security(MiddlewareMixin):

  @staticmethod
  def process_request(request):
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
    session_token = request.session.get('session_token')
    response.set_cookie('browser_session_token', session_token, max_age=600, httponly=True, secure=True, samesite='None')
    return response
