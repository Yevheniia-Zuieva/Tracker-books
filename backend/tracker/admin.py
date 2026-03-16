"""Модуль налаштування адміністративної панелі Django для додатку tracker.
Визначає, як моделі будуть відображатися, фільтруватися та редагуватися в адмінці.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Book, Note, Quote, ReadingSession, User


# Налаштування для Користувача
class CustomUserAdmin(UserAdmin):
    """Налаштування адміністративної панелі для кастомної моделі користувача.
    Додає власні поля (біографія, мета, аватар) до стандартного інтерфейсу Django.
    """

    model = User
    # Власні поля
    fieldsets = UserAdmin.fieldsets + (
        ('Додаткова інформація', {'fields': ('bio', 'yearly_goal', 'avatar')}),
    )
    list_display = ('email', 'username', 'yearly_goal', 'is_staff', 'date_joined')
    search_fields = ('email', 'username')

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """Налаштування відображення моделі Книги в адміністративній панелі."""

    # Які колонки показувати у списку
    list_display = ('title', 'author', 'user', 'status', 'rating', 'progress')
    # Фільтри збоку 
    list_filter = ('status', 'genre', 'user')
    # Пошук по назві та автору
    search_fields = ('title', 'author')

@admin.register(ReadingSession)
class ReadingSessionAdmin(admin.ModelAdmin):
    """Налаштування відображення моделі Сесії читання в адміністративній панелі."""

    list_display = ('book', 'date', 'duration', 'user_info')
    list_filter = ('date',)
    
    def user_info(self, obj):
        """Отримує email користувача, якому належить книга, для зручного відображення в списку.

        Args:
            obj (ReadingSession): Екземпляр сесії читання.

        Returns:
            str: Email власника книги.

        """
        return obj.book.user.email
    user_info.short_description = 'Користувач'

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    """Налаштування відображення моделі Нотатки в адміністративній панелі."""

    list_display = ('book', 'user', 'isFavorite', 'createdAt')
    list_filter = ('isFavorite', 'user')

@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    """Налаштування відображення моделі Цитати в адміністративній панелі."""

    list_display = ('book', 'user', 'isFavorite', 'createdAt')
    list_filter = ('isFavorite', 'user')

# Реєструємо модель користувача з нашими налаштуваннями
admin.site.register(User, CustomUserAdmin)
