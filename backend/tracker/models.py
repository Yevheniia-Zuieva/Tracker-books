from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils import timezone

# 1. Кастомна модель користувача (User)
class User(AbstractUser):

    groups = models.ManyToManyField(
        Group,
        related_name='tracker_user_set', # Унікальне ім'я для зв'язку
        blank=True,
        help_text=('The groups this user belongs to. A user will get all permissions '
                   'granted to each of their groups.'),
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='tracker_user_permissions_set', # Унікальне ім'я для зв'язку
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='user',
    )
    
    email = models.EmailField(unique=True)
    
    # Встановлюємо email як основне поле для входу
    USERNAME_FIELD = 'email'
    
    # Визначаємо, які поля є обов'язковими (крім email та password)
    # Додаємо username 
    REQUIRED_FIELDS = ['username'] 
    
    # Інші поля залишаються без змін
    bio = models.TextField(blank=True, null=True)
    yearly_goal = models.IntegerField(default=12, help_text="Мета: кількість прочитаних книг на рік")

    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    def __str__(self):
        # Якщо email є USERNAME_FIELD, він є основним, але повертаємо username, якщо email немає
        return self.email or self.username

# 2. Книга (Book)
class Book(models.Model):
    STATUS_CHOICES = (
        ('reading', 'Читаю'),
        ('read', 'Прочитано'),
        ('want-to-read', 'Хочу прочитати'),
        ('favorite', 'Улюблені'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='books')
    
    # Основні дані
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    genre = models.CharField(max_length=100)
    year = models.IntegerField(null=True, blank=True)
    cover = models.ImageField(upload_to='book_covers/', null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    
    # Статус та прогрес
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='want-to-read')
    rating = models.IntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 6)])
    totalPages = models.IntegerField(null=True, blank=True)
    currentPage = models.IntegerField(default=0)
    progress = models.IntegerField(default=0) # Розраховується на основі totalPages / currentPage
    
    # Дати та нотатки
    addedDate = models.DateTimeField(auto_now_add=True)
    startDate = models.DateField(null=True, blank=True)
    endDate = models.DateField(null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Автоматичний розрахунок progress
        if self.totalPages and self.currentPage and self.totalPages > 0:
            self.progress = min(100, int((self.currentPage / self.totalPages) * 100))
        else:
            self.progress = 0
            
        if self.status == 'read' and not self.endDate:
            self.endDate = timezone.now().date()
        
        if self.status == 'read' and self.totalPages and self.currentPage < self.totalPages:
            self.currentPage = self.totalPages
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} by {self.author} ({self.user.email})"

# 3. Сесія читання (ReadingSession)
class ReadingSession(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reading_sessions')
    date = models.DateField(auto_now_add=True)
    duration = models.IntegerField(help_text="Тривалість у хвилинах")
    note = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Session for {self.book.title} on {self.date}"

# 4. Нотатка (Note)
class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='book_notes')
    content = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    isFavorite = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Note on {self.book.title}"

# 5. Цитата (Quote)
class Quote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quotes')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='book_quotes')
    content = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    isFavorite = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Quote from {self.book.title}"
