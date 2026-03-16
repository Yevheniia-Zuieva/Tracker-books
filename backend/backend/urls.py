"""
Конфігурація URL-адрес для всього проєкту (Root URLconf).

Цей модуль визначає глобальні маршрути системи:
- Адміністративна панель Django.
- Публічні інтерфейси API (Tracker API).
- Система автентифікації на базі JWT (Djoser).
- Автоматично згенерована специфікація OpenAPI/Swagger.
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Адміністративний інтерфейс
    path('admin/', admin.site.urls),
    
    # 1. Підключаємо наші API (книги, профіль і т.д.)
    path('api/', include('tracker.urls')), 
    
    # 2. Аутентифікація (вхід/реєстрація)
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),

    # Генерація самої схеми (YAML файл)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    
    # Інтерактивний інтерфейс Swagger
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]