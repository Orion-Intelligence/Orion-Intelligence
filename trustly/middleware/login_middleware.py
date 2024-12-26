from django.shortcuts import redirect
from django.urls import reverse

class LoginRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        login_url = reverse('custom_login')
        admin_path = '/admin/'  # Path to be excluded
        if (
            not request.user.is_authenticated and
            request.path != login_url and
            not request.path.startswith(admin_path)
        ):
            return redirect('custom_login')
        return self.get_response(request)
