from dotenv import load_dotenv
load_dotenv()
from django.shortcuts import redirect
from django.urls import reverse_lazy
import os

class LoginRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.is_demo_mode = os.getenv("DEMO", "0") == "1"
        self.login_url = reverse_lazy('custom_login')
        self.index_url = '/'

    def __call__(self, request):
        if request.path == '/crawl_index/' or request.path == '/parser' or request.path == '/parser/' or request.path == '/feeder/unique':
            return self.get_response(request)
        if self.is_demo_mode:
            if (
                not request.user.is_authenticated and
                request.path != str(self.login_url) and
                not request.path.startswith('/admin/')
            ):
                return redirect(self.login_url)
        else:
            if request.path == str(self.login_url):
                return redirect(self.index_url)

        return self.get_response(request)
