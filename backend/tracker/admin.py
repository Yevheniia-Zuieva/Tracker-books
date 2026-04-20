"""
Конфігурація адміністративної панелі Django для застосунку `tracker`.

Цей модуль визначає представлення моделей у системі керування вмістом (Django Admin).
Включає налаштування для фільтрації, пошуку, відображення колонок та
автоматичного керування зв'язками між користувачами та їхнім контентом.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Book, Note, Quote, ReadingSession, User


class CustomUserAdmin(UserAdmin):
    """Налаштування адміністративної панелі для кастомної моделі користувача.
    Додає власні поля (біографія, мета, аватар) до стандартного інтерфейсу Django.
    """

    model = User
    # Визначає групування полів у формі редагування
    fieldsets = UserAdmin.fieldsets + (
        ("Додаткова інформація", {"fields": ("bio", "yearly_goal", "avatar")}),
    )
    # Стовпці, що відображаються в списку всіх користувачів
    list_display = ("email", "username", "yearly_goal", "is_staff", "date_joined")

    # Поля, за якими доступний текстовий пошук
    search_fields = ("email", "username")


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """
    Адміністративний інтерфейс для керування бібліотекою книг.

    Надає інструменти для моніторингу прогресу читання, статусів книг
    та їхніх рейтингів у розрізі кожного користувача.
    """

    # Колонки для швидкого перегляду прогресу
    list_display = ("title", "author", "user", "status", "rating", "progress")

    # Бічна панель фільтрації для швидкого групування даних
    list_filter = ("status", "genre", "user")

    # Пошук по назві та автору
    search_fields = ("title", "author")


@admin.register(ReadingSession)
class ReadingSessionAdmin(admin.ModelAdmin):
    """
    Налаштування логів сесій читання.

    Дозволяє адміністратору відстежувати активність користувачів: коли вони читали
    та скільки часу витрачали на кожну конкретну книгу.
    """

    list_display = ("book", "date", "duration", "user_info")
    list_filter = ("date",)

    def user_info(self, obj):
        """Отримує email користувача, якому належить книга, для зручного відображення в списку.

        Args:
            obj (ReadingSession): Екземпляр сесії читання.

        Returns:
            str: Електронна адреса користувача, якому належить книга.

        """
        return obj.book.user.email

    user_info.short_description = "Користувач"


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    """
    Інтерфейс для керування нотатками користувачів.

    Забезпечує можливість модерації контенту та фільтрації за ознакою "Обране".
    """

    list_display = ("book", "user", "isFavorite", "createdAt")
    list_filter = ("isFavorite", "user")


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    """
    Адміністративна панель для цитат.

    Аналогічна нотаткам, фокусується на текстових фрагментах книг,
    збережених користувачами.
    """

    list_display = ("book", "user", "isFavorite", "createdAt")
    list_filter = ("isFavorite", "user")


# Реєструємо модель користувача з нашими налаштуваннями
admin.site.register(User, CustomUserAdmin)
