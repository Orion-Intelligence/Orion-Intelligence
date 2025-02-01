from django.shortcuts import redirect
from django.urls import reverse_lazy

from trustly.app.helper_manager.env_handler import env_handler


class LoginRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.is_demo_mode = env_handler.get_instance().env("DEMO", "0") == "1"
        self.login_url = reverse_lazy('custom_login')
        self.index_url = '/'

    def __call__(self, request):
        if  request.path == '/crawl_index/' or request.path == '/api/insight/' or request.path == '/api/directory/' or request.path == '/api/search/' or request.path == '/parser'  or request.path == '/feeder/unique' or request.path == '/feeder/unique/' or request.path == '/parser/' or request.path == '/feeder/':
            return self.get_response(request)
        if self.is_demo_mode:
            if not request.user.is_authenticated and request.path != str(self.login_url):
                return redirect(self.login_url)
        else:
            if request.path == str(self.login_url):
                return redirect(self.index_url)

        return self.get_response(request)


