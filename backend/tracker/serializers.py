"""Модуль містить серіалізатори для перетворення моделей бази даних
у JSON-формат та навпаки для REST API.
"""
from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from rest_framework import serializers

from .models import Book, Note, Quote, ReadingSession, User


class UserCreateSerializer(DjoserUserCreateSerializer):
    """Серіалізатор для реєстрації нових користувачів.

    Розширює стандартний серіалізатор Djoser, додаючи поле підтвердження пароля.

    Attributes:
        re_password (CharField): Поле для підтвердження пароля (використовується лише для запису).

    """

    re_password = serializers.CharField(write_only=True)

    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'password', 're_password')

class UserSerializer(serializers.ModelSerializer):
    """Серіалізатор для профілю користувача.

    Надає дані про користувача та включає псевдонім 'status' для поля 'bio',
    щоб відповідати вимогам фронтенду (ProfilePage.tsx).

    Attributes:
        status (CharField): Псевдонім для поля bio (лише для читання).

    """

    status = serializers.CharField(source='bio', read_only=True) 
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'bio', 'yearly_goal', 'avatar', 'date_joined', 'status')
        read_only_fields = ('email', 'date_joined', 'status')


class QuoteSerializer(serializers.ModelSerializer):
    """Серіалізатор для збережених цитат із книг.

    Додатково отримує назву та автора пов'язаної книги.

    Attributes:
        bookTitle (CharField): Назва книги (лише для читання).
        bookAuthor (CharField): Автор книги (лише для читання).

    """

    bookTitle = serializers.CharField(source='book.title', read_only=True)
    bookAuthor = serializers.CharField(source='book.author', read_only=True)
    
    class Meta:
        model = Quote
        fields = ('id', 'book', 'bookTitle', 'bookAuthor', 'content', 'createdAt', 'isFavorite')
        read_only_fields = ('bookTitle', 'bookAuthor', 'createdAt')
        
        
class ReadingSessionSerializer(serializers.ModelSerializer):
    """Серіалізатор для сесій читання.

    Обробляє інформацію про тривалість читання та нотатки до сесії.
    """

    class Meta:
        model = ReadingSession
        fields = ('id', 'book', 'date', 'duration', 'note')
        read_only_fields = ('date',) 

class BookSerializer(serializers.ModelSerializer):
    """Серіалізатор для книг.

    Включає всі основні поля книги, а також вкладені сесії читання, 
    пов'язані з цією книгою.

    Attributes:
        readingSessions (ReadingSessionSerializer): Список пов'язаних сесій читання (лише для читання).

    """

    readingSessions = ReadingSessionSerializer(many=True, read_only=True, source='reading_sessions') 
    book_quotes = QuoteSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = (
            'id', 'title', 'author', 'genre', 'year', 'rating', 'status', 
            'progress', 'totalPages', 'currentPage', 'cover', 'addedDate', 
            'description', 'note', 'startDate', 'endDate', 'readingSessions',
            'book_quotes','isFavorite', 'externalRating', 'ratingsCount', 'isCustom'

        )
        read_only_fields = ('progress', 'addedDate') 

class NoteSerializer(serializers.ModelSerializer):
    """Серіалізатор для користувацьких нотаток до книг.

    Додатково отримує назву та автора пов'язаної книги.

    Attributes:
        bookTitle (CharField): Назва книги (лише для читання).
        bookAuthor (CharField): Автор книги (лише для читання).

    """

    bookTitle = serializers.CharField(source='book.title', read_only=True)
    bookAuthor = serializers.CharField(source='book.author', read_only=True)
    
    class Meta:
        model = Note
        fields = ('id', 'book', 'bookTitle', 'bookAuthor', 'content', 'createdAt', 'isFavorite')
        read_only_fields = ('bookTitle', 'bookAuthor', 'createdAt')

