"""
Модуль описів серіалізаторів даних (DRF Serializers).

Цей модуль визначає логіку перетворення складних типів даних (екземплярів моделей)
у формат JSON для передачі клієнту та десеріалізації вхідних даних із валідацією.
Включає кастомні мапінги полів для забезпечення сумісності з фронтендом (React).
"""

from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from rest_framework import serializers

from .models import Book, Note, Quote, ReadingCycle, ReadingSession, User


class UserCreateSerializer(DjoserUserCreateSerializer):
    """Серіалізатор для реєстрації нових користувачів.

    Розширює стандартний серіалізатор Djoser, додаючи поле підтвердження пароля.

    Attributes:
        re_password (CharField): Поле для підтвердження пароля (використовується лише для запису).

    """

    re_password = serializers.CharField(write_only=True)

    class Meta(DjoserUserCreateSerializer.Meta):
        """Мета-параметри серіалізатора реєстрації."""

        model = User
        fields = ("id", "email", "username", "password", "re_password")


class UserSerializer(serializers.ModelSerializer):
    """Серіалізатор для профілю користувача.

    Надає дані про користувача та включає псевдонім 'status' для поля 'bio',
    щоб відповідати вимогам фронтенду (ProfilePage.tsx).

    Attributes:
        status (CharField):Псевдонім (alias) для поля `bio`. Дозволяє React-компонентам
            використовувати назву 'status', фактично звертаючись до біографії користувача.

    """

    status = serializers.CharField(source="bio", read_only=True)

    class Meta:
        """Мета-дані профілю користувача."""

        model = User
        fields = (
            "id",
            "email",
            "username",
            "bio",
            "yearly_goal",
            "avatar",
            "date_joined",
            "status",
        )
        read_only_fields = ("email", "date_joined", "status")


class QuoteSerializer(serializers.ModelSerializer):
    """Серіалізатор для збережених цитат із книг.

    Додатково отримує назву та автора пов'язаної книги.

    Attributes:
        bookTitle (CharField): Назва книги (лише для читання).
        bookAuthor (CharField): Автор книги (лише для читання).
        user_email (EmailField): Електронна пошта користувача, який зберіг цитату (лише для читання).
    """

    bookTitle = serializers.CharField(source="book.title", read_only=True)
    bookAuthor = serializers.CharField(source="book.author", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        """Конфігурація полів цитати."""

        model = Quote
        fields = (
            "id",
            "book",
            "bookTitle",
            "bookAuthor",
            "content",
            "createdAt",
            "isFavorite",
            "user_email",
        )
        read_only_fields = ("bookTitle", "bookAuthor", "createdAt", "user_email")


class NoteSerializer(serializers.ModelSerializer):
    """Серіалізатор для користувацьких нотаток до книг.

    Додатково отримує назву та автора пов'язаної книги.

    Attributes:
        bookTitle (CharField): Назва книги (лише для читання).
        bookAuthor (CharField): Автор книги (лише для читання).

    """

    bookTitle = serializers.CharField(source="book.title", read_only=True)
    bookAuthor = serializers.CharField(source="book.author", read_only=True)

    class Meta:
        """Конфігурація полів нотатки."""

        model = Note
        fields = (
            "id",
            "book",
            "bookTitle",
            "bookAuthor",
            "content",
            "createdAt",
            "isFavorite",
        )
        read_only_fields = ("bookTitle", "bookAuthor", "createdAt")


class ReadingSessionSerializer(serializers.ModelSerializer):
    """Серіалізатор для сесій читання.

    Обробляє інформацію про тривалість читання та нотатки до сесії.
    """

    class Meta:
        """Конфігурація сесії читання."""

        model = ReadingSession
        fields = ("id", "book", "date", "duration", "note")
        read_only_fields = ("date",)


class ReadingCycleSerializer(serializers.ModelSerializer):
    """Серіалізатор для історії циклів читання.

    Обробляє інформацію про збережені архівні періоди (від початку до кінця),
    коли користувач перечитував книгу.
    """

    class Meta:
        """Конфігурація полів циклу читання."""

        model = ReadingCycle
        fields = ["id", "start_date", "end_date"]


class BookSerializer(serializers.ModelSerializer):
    """Серіалізатор для книг.

    Включає всі основні поля книги, а також вкладені сесії читання,
    пов'язані з цією книгою.

    Attributes:
        readingSessions (ReadingSessionSerializer): Список пов'язаних сесій читання (лише для читання).
        reading_cycles (ReadingCycleSerializer): Історія попередніх циклів читання (лише для читання).
        book_quotes (QuoteSerializer): Колекція збережених цитат до даної книги.
        book_notes (NoteSerializer): Колекція збережених нотаток до даної книги.
    """

    readingSessions = ReadingSessionSerializer(
        many=True, read_only=True, source="reading_sessions"
    )

    reading_cycles = ReadingCycleSerializer(many=True, read_only=True)

    book_quotes = QuoteSerializer(many=True, read_only=True)
    book_notes = NoteSerializer(many=True, read_only=True)

    class Meta:
        """Мета-параметри книги з визначенням полів лише для читання."""

        model = Book
        fields = (
            "id",
            "title",
            "author",
            "genre",
            "year",
            "rating",
            "status",
            "progress",
            "totalPages",
            "currentPage",
            "cover",
            "addedDate",
            "description",
            "note",
            "startDate",
            "endDate",
            "readingSessions",
            "reading_cycles",
            "book_notes",
            "book_quotes",
            "isFavorite",
            "externalRating",
            "ratingsCount",
            "isCustom",
        )
        read_only_fields = ("progress", "addedDate")

        def validate(self, data):
            """Користувацька валідація даних книги.

            Перевіряє, щоб поточна сторінка не перевищувала загальну кількість сторінок.

            Args:
                data (dict): Словник із вхідними даними для валідації.

            Raises:
                serializers.ValidationError: Якщо поточна сторінка більша за загальну.

            Returns:
                dict: Валідовані дані.
            """

            if data.get("currentPage") and data.get("totalPages"):
                if data["currentPage"] > data["totalPages"]:
                    raise serializers.ValidationError(
                        "Поточна сторінка не може бути більшою за загальну кількість сторінок."
                    )
            return data
