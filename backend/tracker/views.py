from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count, Avg, Sum, F
from django.db.models.functions import Coalesce, ExtractYear, ExtractMonth
from django.utils import timezone
from django.conf import settings
import requests
import re # Для очищення даних

from .models import User, Book, ReadingSession, Note, Quote
from .serializers import (
    BookSerializer, ReadingSessionSerializer, NoteSerializer, 
    QuoteSerializer, UserSerializer
)

# --- Базовий клас для фільтрації по користувачу ---
class UserFilteredModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# --- 1. Книги (BookViewSet) ---
class BookViewSet(UserFilteredModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    filter_fields = ['status', 'genre'] 

    def get_queryset(self):
        queryset = super().get_queryset()
        sort_by = self.request.query_params.get('sort', None)
        
        if sort_by == 'by-rating':
            return queryset.order_by('-rating', 'title')
        if sort_by == 'by-genre':
            return queryset.order_by('genre', 'title')

        return queryset.order_by('-addedDate')

# --- 2. Сесії читання (ReadingSessionViewSet) ---
class ReadingSessionViewSet(viewsets.ModelViewSet):
    queryset = ReadingSession.objects.all()
    serializer_class = ReadingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReadingSession.objects.filter(book__user=self.request.user)

    def perform_create(self, serializer):
        book = serializer.validated_data.get('book')
        
        if book.user != self.request.user:
            raise PermissionDenied("Ви не можете додавати сесії до книги, яка вам не належить.")

        # Оновлення статусу книги, якщо вона була 'want-to-read'
        if book.status == 'want-to-read':
            book.status = 'reading'
            book.save() # Викликає save, що оновить прогрес
            
        serializer.save()

# --- 3. Нотатки (NoteViewSet) ---
class NoteViewSet(UserFilteredModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    filter_fields = ['isFavorite']

# --- 4. Цитати (QuoteViewSet) ---
class QuoteViewSet(UserFilteredModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    filter_fields = ['isFavorite']

# --- 5. Профіль та Оновлення (UserProfileView) ---
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

# --- 6. Статистика (ReadingStatsAPIView) ---
class ReadingStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
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
        
        month_map = {1: "Січень", 2: "Лютий", 3: "Березень", 4: "Квітень", 5: "Травень", 6: "Червень", 7: "Липень", 8: "Серпень", 9: "Вересень", 10: "Жовтень", 11: "Листопад", 12: "Грудень"}
        monthly_stats = [
            {'month': month_map.get(item['month_num']), 'count': item['count']}
            for item in monthly_data
        ]
        
        last_activity = all_books.order_by('-addedDate')[:5].values('id', 'title', 'author', 'status', 'addedDate')

        books_with_sessions_count = all_books.annotate(
            total_session_duration=Sum('reading_sessions__duration')
        ).filter(total_session_duration__isnull=False).count()
        
        avg_time_per_book = time_stats['total_duration_minutes'] / books_with_sessions_count if books_with_sessions_count > 0 else 0

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
    """
    Проксі-сервер для Google Books API.
    Приймає запит від фронтенду та повертає відформатовані результати.
    """
    permission_classes = [IsAuthenticated]
    
    # Видаляє HTML теги з опису
    def _clean_html(self, raw_html):
        cleanr = re.compile('<.*?>')
        return re.sub(cleanr, '', raw_html)

    # Конвертація результатів Google Books API у формат фронтенду
    def _format_google_book(self, item):
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
        if not settings.GOOGLE_BOOKS_API_KEY:
            return Response(
                {"error": "Ключ Google Books API не налаштований у settings.py."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        query = request.query_params.get('q', '')
        search_filter = request.query_params.get('filter', 'all')
        
        if not query:
            return Response({"results": []})

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
            
            if 'items' in data:
                formatted_results = [self._format_google_book(item) for item in data['items']]
                return Response({"results": formatted_results})
            else:
                return Response({"results": []})

        except requests.exceptions.RequestException as e:
            print(f"Помилка запиту до Google Books API: {e}")
            return Response(
                {"error": "Не вдалося підключитися до зовнішнього API пошуку."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
