"""
Модуль маршрутизації (URL Dispatcher) застосунку `tracker`.

Цей модуль визначає структуру URL-адрес для взаємодії з REST API.
Маршрутизація розділена на два типи:
1. **Автоматична**: реалізована через `DRF DefaultRouter` для стандартних CRUD операцій
   над основними сутностями (Книги, Сесії, Нотатки, Цитати).
2. **Спеціалізована**: ручне визначення шляхів для функціоналу, що виходить за межі
   стандартного CRUD (Профіль, Глобальна статистика, Зовнішній пошук).

Доступ до API зазвичай здійснюється за префіксом, визначеним у кореневому `urls.py` проекту.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .views import (
    BookViewSet,
    ExternalSearchAPIView,
    NoteViewSet,
    QuoteViewSet,
    ReadingSessionViewSet,
    ReadingStatsAPIView,
    UserProfileView,
)

# Ініціалізація стандартного роутера Django REST Framework.
# DefaultRouter автоматично генерує набір URL для стандартних дій:
# list, create, retrieve, update, partial_update та destroy.
router = DefaultRouter()

#: Реєстрація кінцевої точки для управління бібліотекою книг.
router.register(r"books", BookViewSet, basename="book")

#: Реєстрація кінцевої точки для логування сесій читання.
router.register(r"sessions", ReadingSessionViewSet, basename="session")

#: Реєстрація кінцевої точки для роботи з розширеними нотатками.
router.register(r"notes", NoteViewSet, basename="note")

#: Реєстрація кінцевої точки для збереження та фільтрації цитат.
router.register(r"quotes", QuoteViewSet, basename="quote")

#: Список патернів URL, що обробляються застосунком.
urlpatterns = [
    # Включення всіх маршрутів, згенерованих роутером (автоматичні CRUD)
    path("", include(router.urls)),
    # --- Спеціалізовані API View (Manual Endpoints) ---
    #: Кінцева точка для перегляду та редагування особистих даних користувача.
    path("profile/", UserProfileView.as_view(), name="user-profile"),
    #: Кінцева точка для отримання глобальної статистики читання.
    path("stats/", ReadingStatsAPIView.as_view(), name="reading-stats"),
    #: Технічний ендпоінт для збору помилок із фронтенд-частини (React).
    path("logs/frontend/", views.frontend_log_view, name="frontend-logs"),
    #: Проксі-маршрут для взаємодії з Google Books API.
    path("search/external/", ExternalSearchAPIView.as_view(), name="external-search"),
    #: Ендпоінт для відправки повідомлень зворотного зв'язку адміністрації.
    path("feedback/", views.FeedbackAPIView.as_view(), name="feedback"),
]

# --- Глобальна обробка помилок ---
# Перевизначення стандартних обробників Django для повернення
# кастомних сторінок або JSON-помилок.

#: Шлях до функції представлення для помилки 404 (Not Found).
handler404 = "tracker.views.custom_404_view"

#: Шлях до функції представлення для помилки 500 (Internal Server Error).
handler500 = "tracker.views.custom_500_view"
