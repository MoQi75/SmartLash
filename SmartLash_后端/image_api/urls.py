from django.urls import path
from image_api import views
urlpatterns=[
    path('get_main/',views.getMain),
    path('get_main_b/',views.getMain_B),
    path('hello/', views.hello),
    path('chat/', views.chat),
]
