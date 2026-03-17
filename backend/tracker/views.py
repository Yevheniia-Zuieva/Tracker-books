"""Модуль містить представлення (views) для обробки запитів API.
Включає CRUD операції для моделей, статистику та інтеграцію з зовнішнім API.
"""
import logging
import re  # Для очищення даних

import requests
from django.conf import settings
from django.db.models import Avg, Count, Sum
from django.db.models.functions import Coalesce, ExtractMonth
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Book, Note, Quote, ReadingSession
from .serializers import BookSerializer, NoteSerializer, QuoteSerializer, ReadingSessionSerializer, UserSerializer

# Ініціалізуємо логер для цього модуля
logger = logging.getLogger('tracker')

class UserFilteredModelViewSet(viewsets.ModelViewSet):
    """Базовий ViewSet, який обмежує доступ до об'єктів лише їх автору.

    Attributes:
        permission_classes (list): Перелік класів дозволів (тільки авторизовані).

    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Фільтрує набір даних за поточним авторизованим користувачем.

        Returns:
            QuerySet: Відфільтровані об'єкти для поточного користувача.

        """
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Зберігає новий об'єкт, автоматично прив'язуючи його до поточного користувача.

        Args:
            serializer: Серіалізатор з валідованими даними об'єкта.

        """
        serializer.save(user=self.request.user)
        logger.info(f"User {self.request.user.id} created a new {self.queryset.model.__name__}")

class BookViewSet(UserFilteredModelViewSet):
    """ViewSet для управління книгами користувача (CRUD операції).
    Підтримує сортування за рейтингом, жанром або датою додавання.
    """

    queryset = Book.objects.all()
    serializer_class = BookSerializer
    filter_fields = ['status', 'genre'] 

    def get_queryset(self):
        """Отримує набір книг користувача із застосуванням сортування,
        якщо вказано параметр запиту 'sort'.

        Returns:
            QuerySet: Відсортовані книги.

        """
        queryset = super().get_queryset()
        sort_by = self.request.query_params.get('sort', None)
        
        if sort_by:
            logger.debug(f"Sorting books for user {self.request.user.id} by {sort_by}")

        if sort_by == 'by-rating':
            return queryset.order_by('-rating', 'title')
        if sort_by == 'by-genre':
            return queryset.order_by('genre', 'title')

        return queryset.order_by('-addedDate')

class ReadingSessionViewSet(viewsets.ModelViewSet):
    """ViewSet для створення та перегляду сесій читання."""

    queryset = ReadingSession.objects.all()
    serializer_class = ReadingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Отримує сесії читання лише для книг, що належать поточному користувачу.

        Returns:
            QuerySet: Сесії читання користувача.

        """
        return ReadingSession.objects.filter(book__user=self.request.user)

    def perform_create(self, serializer):
        """Створює нову сесію читання. Перевіряє права доступу до книги та
        автоматично оновлює статус книги на 'reading', якщо необхідно.

        Args:
            serializer: Серіалізатор з даними сесії.
            
        Raises:
            PermissionDenied: Якщо користувач намагається додати сесію до чужої книги.

        """
        book = serializer.validated_data.get('book')
        
        if book.user != self.request.user:
            logger.warning(f"Unauthorized access attempt: User {self.request.user.id} tried to add session to book {book.id}")
            raise PermissionDenied("Ви не можете додавати сесії до книги, яка вам не належить.")

        # Оновлення статусу книги, якщо вона була 'want-to-read'
        if book.status == 'want-to-read':
            book.status = 'reading'
            book.save() # Викликає save, що оновить прогрес
            logger.info(f"Book status updated to 'reading' for book {book.id} (User {self.request.user.id})")
            
        serializer.save()
        logger.info(f"New reading session added for book {book.id}")

class NoteViewSet(UserFilteredModelViewSet):
    """ViewSet для управління нотатками користувача."""

    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    filter_fields = ['isFavorite']

class QuoteViewSet(UserFilteredModelViewSet):
    """ViewSet для управління цитатами користувача."""

    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    filter_fields = ['isFavorite']

class UserProfileView(generics.RetrieveUpdateAPIView):
    """API View для перегляду та оновлення профілю поточного користувача."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Отримує об'єкт поточного авторизованого користувача.

        Returns:
            User: Поточний користувач.

        """
        return self.request.user

class ReadingStatsAPIView(APIView):
    """API View для отримання детальної статистики читання користувача."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Обчислює та повертає зведену статистику користувача:
        виконання річної мети, кількість сторінок, час читання та статистику за жанрами.

        Args:
            request: Об'єкт HTTP запиту.

        Returns:
            Response: JSON з розрахованою статистикою.

        """
        logger.info(f"Generating reading stats for user {request.user.id}")

        user = request.user
        current_year = timezone.now().year
        
        all_books = Book.objects.filter(user=user)
        read_books = all_books.filter(status='read')
        
        read_this_year_count = read_books.filter(endDate__year=current_year).count()
        
        time_stats = ReadingSession.objects.filter(book__user=user).aggregate(
            total_duration_minutes=Coalesce(Sum('duration'), 0),
            avg_duration_session=Coalesce(Avg('duration'), 0),
            total_sessions=Count('id')
        )
        
        page_stats = read_books.aggregate(
            total_pages_read=Coalesce(Sum('totalPages'), 0),
            avg_rating=Coalesce(Avg('rating'), 0.0),
            avg_pages_per_book=Coalesce(Avg('totalPages'), 0.0)
        )

        genre_stats = all_books.values('genre').annotate(count=Count('genre')).order_by('-count')
        
        author_stats = all_books.values('author').annotate(count=Count('author')).order_by('-count')[:5]

        monthly_data = read_books.filter(
            endDate__year=current_year
        ).annotate(
            month_num=ExtractMonth('endDate')
        ).values('month_num').annotate(count=Count('id')).order_by('month_num')
        
        month_map = {
            1: "Січень", 2: "Лютий", 3: "Березень", 4: "Квітень", 
            5: "Травень", 6: "Червень", 7: "Липень", 8: "Серпень", 
            9: "Вересень", 10: "Жовтень", 11: "Листопад", 12: "Грудень"
        }
        monthly_stats = [
            {'month': month_map.get(item['month_num']), 'count': item['count']}
            for item in monthly_data
        ]
        
        last_activity = all_books.order_by('-addedDate')[:5].values('id', 'title', 'author', 'status', 'addedDate')

        books_with_sessions_count = all_books.annotate(
            total_session_duration=Sum('reading_sessions__duration')
        ).filter(total_session_duration__isnull=False).count()
        
        avg_time_per_book = time_stats['total_duration_minutes'] / books_with_sessions_count if books_with_sessions_count > 0 else 0

        logger.debug(f"Stats successfully calculated for user {user.id}")

        return Response({
            'yearlyGoal': user.yearly_goal,
            'booksReadThisYear': read_this_year_count,
            'progressToGoal': min(100, int((read_this_year_count / user.yearly_goal) * 100)) if user.yearly_goal > 0 else 0,
            
            # Загальна статистика
            'totalBooks': all_books.count(),
            'readCount': read_books.count(),
            'averageRating': round(page_stats['avg_rating'], 1),
            'genresCount': len(genre_stats),
            'totalPagesRead': page_stats['total_pages_read'],
            'averagePagesPerBook': round(page_stats['avg_pages_per_book'], 0),
            
            # Статистика часу
            'totalReadingTime': time_stats['total_duration_minutes'], 
            'totalReadingSessions': time_stats['total_sessions'],
            'averageSessionDuration': round(time_stats['avg_duration_session'], 0),
            'averageTimePerBook': round(avg_time_per_book, 0), 
            
            # Дані для графіків
            'genreStats': list(genre_stats),
            'monthlyStats': monthly_stats,
            'authorStats': list(author_stats),
            'lastActivity': list(last_activity),
        })

# --- 7. Зовнішній пошук (ExternalSearchAPIView) ---
class ExternalSearchAPIView(APIView):
    """Проксі-сервер для взаємодії з Google Books API.
    
    Забезпечує безпечний пошук книг за запитом користувача, приховуючи 
    API-ключ на сервері та форматуючи результати для фронтенду.
    """

    permission_classes = [IsAuthenticated]
    
    # Видаляє HTML теги з опису
    def _clean_html(self, raw_html):
        """Видаляє HTML-теги з переданого тексту.

        Args:
            raw_html (str): Текст, що містить HTML-теги.

        Returns:
            str: Очищений текст.

        """
        cleanr = re.compile('<.*?>')
        return re.sub(cleanr, '', raw_html)

    # Конвертація результатів Google Books API у формат фронтенду
    def _format_google_book(self, item):
        """Конвертує структуру даних від Google Books API у формат, сумісний з фронтендом.

        Args:
            item (dict): Словник з даними книги від Google API.

        Returns:
            dict: Відформатований словник з необхідними полями.

        """
        volume_info = item.get('volumeInfo', {})
        
        title = volume_info.get('title', 'Невідома назва')
        authors = volume_info.get('authors', ['Невідомий автор'])
        description = self._clean_html(volume_info.get('description', 'Опис відсутній.'))
        
        # Обкладинка: використовуємо Large, якщо доступно, інакше Thumbnail
        image_links = volume_info.get('imageLinks', {})
        cover = image_links.get('large') or image_links.get('thumbnail') or None
        
        genre = volume_info.get('categories', ['Загальне'])[0]
        
        # Рік: витягуємо перші 4 цифри
        published_date = volume_info.get('publishedDate', '0000')
        year_str = published_date.split('-')[0]
        year = int(year_str) if year_str and year_str.isdigit() else 0
        
        pages = volume_info.get('pageCount', 0)
        
        return {
            "id": item['id'], # Використовуємо Google ID як зовнішній ID
            "title": title,
            "author": ", ".join(authors),
            "genre": genre,
            "year": year,
            "pages": pages,
            "description": description,
            "cover": cover,
        }

    def get(self, request, *args, **kwargs):
        """Обробляє GET-запит для пошуку книг.
        
        Формує запит до Google Books API на основі переданих параметрів, 
        отримує результати, форматує їх та повертає на клієнт.

        Args:
            request (Request): Об'єкт запиту DRF. Очікує query-параметри:
                - q (str): Рядок пошуку.
                - filter (str, optional): Критерій пошуку ('title', 'author', 'genre', 'all').

        Returns:
            Response: Відповідь зі статусом 200 та списком відформатованих книг
                      або статусом 500/503 у разі помилки конфігурації/сервера.

        """
        if not settings.GOOGLE_BOOKS_API_KEY:
            logger.critical("Google Books API Key is missing in settings.py")
            return Response(
                {"error": "Ключ Google Books API не налаштований у settings.py."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        query = request.query_params.get('q', '')
        search_filter = request.query_params.get('filter', 'all')
        
        if not query:
            return Response({"results": []})
        
        logger.info(f"Searching for '{query}' via Google Books API (Filter: {search_filter})")

        filter_map = {
            'title': 'intitle',
            'author': 'inauthor',
            'genre': 'subject',
            'all': ''
        }
        
        google_query_prefix = filter_map.get(search_filter, '')
        
        if google_query_prefix:
            full_query = f"{google_query_prefix}:{query}"
        else:
            full_query = query
        
        # Параметри для запиту до Google Books API
        params = {
            'q': full_query,
            'maxResults': 20, 
            'key': settings.GOOGLE_BOOKS_API_KEY,
            'langRestrict': 'uk|en'
        }
        
        GOOGLE_API_URL = "https://www.googleapis.com/books/v1/volumes"
        
        try:
            response = requests.get(GOOGLE_API_URL, params=params, timeout=5)
            response.raise_for_status() 
            data = response.json()
            
            count = len(data.get('items', []))
            logger.info(f"Google API returned {count} results for query '{query}'")

            if 'items' in data:
                formatted_results = [self._format_google_book(item) for item in data['items']]
                return Response({"results": formatted_results})
            else:
                return Response({"results": []})

        except requests.exceptions.RequestException as e:
            logger.error(f"Google Books API Request failed: {str(e)}", exc_info=True)
            return Response(
                {"error": "Не вдалося підключитися до зовнішнього API пошуку."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
