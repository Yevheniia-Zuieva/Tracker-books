from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookViewSet, ReadingSessionViewSet, NoteViewSet, QuoteViewSet, 
    UserProfileView, ReadingStatsAPIView, ExternalSearchAPIView
)

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'sessions', ReadingSessionViewSet, basename='session')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'quotes', QuoteViewSet, basename='quote')

urlpatterns = [
    path('', include(router.urls)), # Книги та інше
    path('profile/', UserProfileView.as_view(), name='user-profile'), # Профіль
    path('stats/', ReadingStatsAPIView.as_view(), name='reading-stats'),
    path('search/external/', ExternalSearchAPIView.as_view(), name='external-search'),
]