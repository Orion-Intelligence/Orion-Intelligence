from decouple import config
from django.http import HttpResponseRedirect
from urllib.parse import urlencode, urlparse, parse_qs


class EmailApiAccessMiddleware:
  def __init__(self, get_response):
    self.get_response = get_response
    self.api_access = config("API_ACCESS", default="0", cast=int)

  def __call__(self, request):
    # Only process for the search endpoint
    if request.path == "/search/" and "pSearchParamType" in request.GET:
      query_params = request.GET.copy()
      p_search_param_type = query_params.get("pSearchParamType", "")

      if p_search_param_type == "persona":
        if self.api_access == 0:
          query_params["pSearchParamType"] = "all"
          new_url = f"{request.path}?{urlencode(query_params)}"
          return HttpResponseRedirect(new_url)

    return self.get_response(request)
