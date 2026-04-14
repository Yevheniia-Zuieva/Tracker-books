import logging

from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone

logger = logging.getLogger('tracker')

# 1. Кастомна модель користувача (User)
class User(AbstractUser):
    """Кастомна модель користувача, що розширює стандартну модель Django `AbstractUser`.

    Ця модель використовує `email` як основне поле для автентифікації замість `username`.
    Вона також містить додаткові поля профілю, такі як біографія, річна мета читання 
    та аватар.

    Attributes:
        groups (ManyToManyField): Групи, до яких належить користувач.
        user_permissions (ManyToManyField): Специфічні права доступу користувача.
        email (EmailField): Унікальна електронна адреса (використовується для входу).
        bio (TextField, optional): Коротка інформація про користувача.
        yearly_goal (IntegerField): Мета користувача щодо кількості прочитаних книг на рік (за замовчуванням 12).
        avatar (ImageField, optional): Зображення профілю користувача.

    """

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
        """Повертає рядкове представлення користувача.

        Returns:
            str: Електронна пошта користувача (або `username`, якщо `email` відсутній).

        """
        return self.email or self.username

# 2. Книга (Book)
class Book(models.Model):
    """Модель, що представляє книгу в особистій бібліотеці користувача.
    
    Зберігає детальну інформацію про книгу, її статус у бібліотеці, 
    оцінку, а також автоматично розраховує прогрес читання.
    
    Attributes:
        user (ForeignKey): Посилання на користувача-власника запису (User).
        title (CharField): Назва книги.
        author (CharField): Автор книги.
        genre (CharField): Жанр книги.
        year (IntegerField, optional): Рік видання.
        cover (ImageField, optional): Обкладинка книги.
        description (TextField, optional): Опис або анотація книги.
        status (CharField): Поточний статус (наприклад, 'reading', 'read', 'want-to-read').
        rating (IntegerField, optional): Оцінка користувача від 1 до 5.
        totalPages (IntegerField, optional): Загальна кількість сторінок у книзі.
        currentPage (IntegerField): Поточна прочитана сторінка.
        progress (IntegerField): Відсоток прочитаного (0-100), розраховується автоматично.
        addedDate (DateTimeField): Дата та час додавання книги до бібліотеки.
        startDate (DateField, optional): Дата початку читання.
        endDate (DateField, optional): Дата завершення читання.
        note (TextField, optional): Загальна нотатка до книги.

    """

    STATUS_CHOICES = (
        ('reading', 'Читаю'),
        ('read', 'Прочитано'),
        ('want-to-read', 'Хочу прочитати'),
        ('favorite', 'Улюблені'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='books')
    
    # Основні дані
    title = models.CharField(max_length=255, db_index=True)
    author = models.CharField(max_length=255, db_index=True)
    genre = models.CharField(max_length=255)
    year = models.IntegerField(null=True, blank=True)
    cover = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    
    isFavorite = models.BooleanField(default=False)
    isCustom = models.BooleanField(default=False)
    externalRating = models.FloatField(null=True, blank=True) # Рейтинг Google
    ratingsCount = models.IntegerField(null=True, blank=True) # Кількість голосів для рейтингу Google

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
        """Перевизначений метод збереження моделі.
        
        Автоматично розраховує відсоток прогресу читання на основі `currentPage` 
        та `totalPages`. Якщо статус змінюється на 'read', автоматично фіксує 
        `endDate` (якщо він не заданий) та встановлює `currentPage` рівним `totalPages`.
        """
        # Визначаємо, чи це створення нової книги, чи оновлення існуючої
        is_new = self.pk is None

        # 1. Логування розрахунку прогресу (DEBUG рівень)
        if self.totalPages and self.currentPage and self.totalPages > 0:
            self.progress = min(100, round((self.currentPage / self.totalPages) * 100))
        else:
            # Якщо сторінок 0, але книга в списку - це може бути помилка даних
            if self.totalPages == 0:
                logger.warning(f"Data Anomaly: Book ID {self.id} has 0 total pages.")
            self.progress = 0
            
        # 2. Логування автоматичної фіксації дати завершення
        if self.status == 'read' and not self.endDate:
            self.endDate = timezone.now().date()
            logger.info(f"Book Lifecycle: Status 'read' detected. Auto-setting endDate for Book ID {self.id}")
        
        # 3. Логування автоматичного корегування сторінок
        if self.status == 'read' and self.totalPages and self.currentPage < self.totalPages:
            logger.debug(f"Adjusting currentPage to totalPages for Book ID {self.id} due to 'read' status")
            self.currentPage = self.totalPages
            
        try:
            # Власне критична операція з базою даних
            super().save(*args, **kwargs)
            
            # Логування успішного завершення операції
            if is_new:
                logger.info(f"DB Success: New book record created (ID: {self.id})")
            else:
                logger.debug(f"DB Success: Book record updated (ID: {self.id})")
                
        except Exception as e:
            # Логування критичної помилки запису в БД
            logger.critical(f"DB Critical Error: Failed to save Book record. Reason: {str(e)}", exc_info=True)
            raise e # Прокидаємо помилку далі

    def __str__(self):
        """Повертає рядкове представлення книги.

        Returns:
            str: Рядок у форматі "Назва by Автор (email користувача)".

        """
        return f"{self.title} by {self.author} ({self.user.email})"

# 3. Сесія читання (ReadingSession)
class ReadingSession(models.Model):
    """Модель, що представляє окрему сесію читання книги користувачем.

    Дозволяє відстежувати, скільки часу користувач витратив на читання певної книги
    в конкретний день. Використовується для генерації статистики.

    Attributes:
        book (ForeignKey): Посилання на книгу, що читається (Book).
        date (DateField): Дата проведення сесії (встановлюється автоматично).
        duration (IntegerField): Тривалість читання в секундах.
        note (TextField, optional): Короткий запис або думки щодо цієї конкретної сесії.

    """

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reading_sessions')
    date = models.DateField(auto_now_add=True)
    duration = models.IntegerField(help_text="Тривалість у секундах")
    note = models.TextField(blank=True, null=True)
    
    def __str__(self):
        """Повертає рядкове представлення сесії читання.

        Returns:
            str: Рядок із зазначенням назви книги та дати сесії.

        """
        return f"Session for {self.book.title} on {self.date}"

# 4. Нотатка (Note)
class Note(models.Model):
    """Модель для збереження розгорнутих нотаток до конкретної книги.

    Користувач може створювати безліч нотаток для однієї книги та позначати 
    деякі з них як улюблені.

    Attributes:
        user (ForeignKey): Посилання на автора нотатки (User).
        book (ForeignKey): Посилання на книгу, якої стосується нотатка (Book).
        content (TextField): Текст нотатки.
        createdAt (DateTimeField): Дата та час створення нотатки.
        isFavorite (BooleanField): Прапорець, що вказує, чи додана нотатка до улюблених.

    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='book_notes')
    content = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    isFavorite = models.BooleanField(default=False)
    
    def __str__(self):
        """Повертає рядкове представлення нотатки.

        Returns:
            str: Рядок із зазначенням назви книги, до якої належить нотатка.

        """
        return f"Note on {self.book.title}"

# 5. Цитата (Quote)
class Quote(models.Model):
    """Модель для збереження вибраних цитат із книги.

    Подібна до моделі `Note`, але семантично призначена саме для збереження
    прямої мови чи уривків з тексту книги.

    Attributes:
        user (ForeignKey): Посилання на користувача, який зберіг цитату (User).
        book (ForeignKey): Посилання на книгу, з якої взято цитату (Book).
        content (TextField): Текст цитати.
        createdAt (DateTimeField): Дата та час збереження цитати.
        isFavorite (BooleanField): Прапорець, що вказує, чи додана цитата до улюблених.

    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quotes')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='book_quotes')
    content = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    isFavorite = models.BooleanField(default=False)
    
    def __str__(self):
        """Повертає рядкове представлення цитати.

        Returns:
            str: Рядок із зазначенням назви книги, з якої взято цитату.

        """
        return f"Quote from {self.book.title}"
