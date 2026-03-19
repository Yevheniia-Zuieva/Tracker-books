"""Модуль маршрутизації (URL-конфігурація) для додатку tracker.
Визначає кінцеві точки (endpoints) для REST API за допомогою DefaultRouter
та реєструє окремі шляхи для профілю, статистики і зовнішнього пошуку.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .views import BookViewSet, NoteViewSet, QuoteViewSet, ReadingSessionViewSet, ReadingStatsAPIView, UserProfileView

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'sessions', ReadingSessionViewSet, basename='session')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'quotes', QuoteViewSet, basename='quote')

urlpatterns = [
    path('', include(router.urls)), # Книги та інше
    path('profile/', UserProfileView.as_view(), name='user-profile'), # Профіль
    path('stats/', ReadingStatsAPIView.as_view(), name='reading-stats'),
    path('logs/frontend/', views.frontend_log_view, name='frontend-logs'),
]

handler404 = 'tracker.views.custom_404_view'
handler500 = 'tracker.views.custom_500_view'