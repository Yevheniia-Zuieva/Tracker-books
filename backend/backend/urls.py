from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 1. Підключаємо наші API (книги, профіль і т.д.)
    path('api/', include('tracker.urls')), 
    
    # 2. Аутентифікація (вхід/реєстрація)
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
]