from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from .models import User, Book, ReadingSession, Note, Quote

# 1. Створення користувача
class UserCreateSerializer(DjoserUserCreateSerializer):
    re_password = serializers.CharField(write_only=True)

    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'password', 're_password')

# 2. Профіль користувача
class UserSerializer(serializers.ModelSerializer):
    # Імітація поля 'status' для ProfilePage.tsx
    status = serializers.CharField(source='bio', read_only=True) 
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'bio', 'yearly_goal', 'avatar', 'date_joined', 'status')
        read_only_fields = ('email', 'date_joined', 'status')

# 3. Сесія читання
class ReadingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingSession
        fields = ('id', 'book', 'date', 'duration', 'note')
        read_only_fields = ('date',) 

# 4. Книга
class BookSerializer(serializers.ModelSerializer):

    readingSessions = ReadingSessionSerializer(many=True, read_only=True, source='reading_sessions') 
    
    class Meta:
        model = Book
        fields = (
            'id', 'title', 'author', 'genre', 'year', 'rating', 'status', 
            'progress', 'totalPages', 'currentPage', 'cover', 'addedDate', 
            'description', 'note', 'startDate', 'endDate', 'readingSessions'
        )
        read_only_fields = ('progress',) 

# 5. Нотатки
class NoteSerializer(serializers.ModelSerializer):
    bookTitle = serializers.CharField(source='book.title', read_only=True)
    bookAuthor = serializers.CharField(source='book.author', read_only=True)
    
    class Meta:
        model = Note
        fields = ('id', 'book', 'bookTitle', 'bookAuthor', 'content', 'createdAt', 'isFavorite')
        read_only_fields = ('bookTitle', 'bookAuthor', 'createdAt')

# 6. Цитати
class QuoteSerializer(serializers.ModelSerializer):
    bookTitle = serializers.CharField(source='book.title', read_only=True)
    bookAuthor = serializers.CharField(source='book.author', read_only=True)
    
    class Meta:
        model = Quote
        fields = ('id', 'book', 'bookTitle', 'bookAuthor', 'content', 'createdAt', 'isFavorite')
        read_only_fields = ('bookTitle', 'bookAuthor', 'createdAt')
