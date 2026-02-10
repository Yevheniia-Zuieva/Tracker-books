from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Book, ReadingSession, Note, Quote

# Налаштування для Користувача
class CustomUserAdmin(UserAdmin):
    model = User
    # Власні поля
    fieldsets = UserAdmin.fieldsets + (
        ('Додаткова інформація', {'fields': ('bio', 'yearly_goal', 'avatar')}),
    )
    list_display = ('email', 'username', 'yearly_goal', 'is_staff', 'date_joined')
    search_fields = ('email', 'username')

# Налаштування для Книги
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    # Які колонки показувати у списку
    list_display = ('title', 'author', 'user', 'status', 'rating', 'progress')
    # Фільтри збоку 
    list_filter = ('status', 'genre', 'user')
    # Пошук по назві та автору
    search_fields = ('title', 'author')

# Налаштування для сесій читання
@admin.register(ReadingSession)
class ReadingSessionAdmin(admin.ModelAdmin):
    list_display = ('book', 'date', 'duration', 'user_info')
    list_filter = ('date',)
    
    # Додаткова функція, щоб показати, чия це книга
    def user_info(self, obj):
        return obj.book.user.email
    user_info.short_description = 'Користувач'

# Налаштування для нотаток
@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('book', 'user', 'isFavorite', 'createdAt')
    list_filter = ('isFavorite', 'user')

# Налаштування для цитат
@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ('book', 'user', 'isFavorite', 'createdAt')
    list_filter = ('isFavorite', 'user')

# Реєструємо модель користувача з нашими налаштуваннями
admin.site.register(User, CustomUserAdmin)
