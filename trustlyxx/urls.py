from django.urls import path
from app import views, api
from django.contrib import admin

urlpatterns = [
  #path('admin/', admin.site.urls),

  path('', views.index, name='home'),
  path('login', views.custom_login, name='custom_login'),
  path('directory/', views.directory, name='directory'),
  path('search/', views.search, name='search'),

  #path('update_status/', views.update_status, name='manage_search'),

  path('api/directory/', api.get_directory, name='api/directory'),
  path('api/insight/', api.get_insight, name='api/insight'),
  path('api/search/', api.get_search_result, name='api/search'),

]

handler400 = views.error_page_400
handler403 = views.error_page_403
handler404 = views.error_page_404
handler500 = views.error_page_500

