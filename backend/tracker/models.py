"""
Модуль визначення схеми бази даних (ORM моделі) для проєкту Tracker Books.

Цей модуль містить опис структур даних для користувачів, книг, сесій читання,
нотаток та цитат. Він також інкапсулює бізнес-логіку обробки життєвого циклу книги,
таку як автоматичний розрахунок відсотка прочитаного та фіксацію дат завершення.
"""

import logging

from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone

# Ініціалізація логера для відстеження операцій з даними
logger = logging.getLogger("tracker")


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
        related_name="tracker_user_set",  # Унікальне ім'я для зв'язку
        blank=True,
        help_text=(
            "The groups this user belongs to. A user will get all permissions "
            "granted to each of their groups."
        ),
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="tracker_user_permissions_set",  # Унікальне ім'я для зв'язку
        blank=True,
        help_text="Specific permissions for this user.",
        related_query_name="user",
    )

    email = models.EmailField(unique=True)

    # Встановлює email як основне поле для входу
    USERNAME_FIELD = "email"

    #: Список полів, що вимагаються при створенні суперкористувача.
    REQUIRED_FIELDS = ["username"]
    
    status = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        default="Активний читач",
        help_text="Короткий статус користувача"
    )

    bio = models.TextField(blank=True, null=True)
    yearly_goal = models.IntegerField(
        default=12, help_text="Мета: кількість прочитаних книг на рік"
    )

    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)

    def __str__(self):
        """Повертає рядкове представлення користувача.

        Returns:
            str: Електронна пошта користувача (або `username`, якщо `email` відсутній).

        """
        return self.email or self.username


class Book(models.Model):
    """Модель, що представляє книгу в особистій бібліотеці користувача.

    Містить метадані книги, інформацію про джерело (Google Books або ручне введення)
    та відстежує персональний прогрес користувача.

    Attributes:
        user (ForeignKey): Посилання на об'єкт `User`, якому належить книга.
            Використовується каскадне видалення (`CASCADE`).
        title (CharField): Назва книги. Поле індексоване для прискорення пошуку за назвою.
        author (CharField): Автор книги. Поле індексоване для оптимізації фільтрації.
        genre (CharField): Жанр книги.
        year (IntegerField, optional): Рік видання. Може бути порожнім.
        cover (ImageField, optional): URL-адреса або шлях до зображення обкладинки.
        description (TextField, optional): Опис або анотація книги.
        isFavorite (BooleanField): Прапорець, що вказує, чи додана книга до списку улюблених.
        isCustom (BooleanField): Визначає походження запису: `True` — додано вручну,
            `False` — імпортовано з Google Books API.
        externalRating (FloatField, optional): Середній рейтинг книги за даними Google Books.
        ratingsCount (IntegerField, optional): Кількість оцінок, на основі яких
            розраховано `externalRating`.
        status (CharField): Поточний етап читання Допустимі значення: 'reading', 'read', 'want-to-read'.
        rating (IntegerField, optional): Персональна оцінка користувача за шкалою від 1 до 5.
        totalPages (IntegerField, optional): Загальна кількість сторінок у книзі.
        currentPage (IntegerField): Кількість фактично прочитаних сторінок. За замовчуванням `0`.
        progress (IntegerField): Відсоток прочитаного (0-100), розраховується автоматично.
        addedDate (DateTimeField): Дата та час додавання книги до бібліотеки.
        startDate (DateField, optional): Дата початку читання.
        endDate (DateField, optional): Дата завершення читання. Встановлюється автоматично
            при переході статусу в `read`.
        note (TextField, optional): Загальна нотатка до книги.

    """

    STATUS_CHOICES = (
        ("reading", "Читаю"),
        ("read", "Прочитано"),
        ("want-to-read", "Хочу прочитати"),
        ("favorite", "Улюблені"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="books")

    # Основні дані
    title = models.CharField(max_length=255, db_index=True)
    author = models.CharField(max_length=255, db_index=True)
    genre = models.CharField(max_length=255)
    year = models.IntegerField(null=True, blank=True)
    cover = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    # Інтеграційні поля
    isFavorite = models.BooleanField(default=False)
    isCustom = models.BooleanField(default=False)
    externalRating = models.FloatField(null=True, blank=True)  # Рейтинг Google
    ratingsCount = models.IntegerField(
        null=True, blank=True
    )  # Кількість голосів для рейтингу Google

    # Статус та прогрес (динамічні поля)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="want-to-read"
    )
    rating = models.IntegerField(
        null=True, blank=True, choices=[(i, i) for i in range(1, 6)]
    )
    totalPages = models.IntegerField(null=True, blank=True)
    currentPage = models.IntegerField(default=0)
    progress = models.IntegerField(
        default=0
    )  # Розраховується на основі totalPages / currentPage

    # Хронологія та нотатки
    addedDate = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    startDate = models.DateField(null=True, blank=True)
    endDate = models.DateField(null=True, blank=True)
    note = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        """Перевизначений метод збереження моделі з інтегрованою бізнес-логікою життєвого циклу книги.

        Цей метод діє як "запобіжник" та автоматизує рутинні оновлення даних перед фактичним
        записом у базу даних. Він виконує чотири основні перевірки:

        1. Динамічний прогрес: Автоматично обчислює поле `progress` (0-100%) на основі
           відношення `currentPage` до `totalPages`.
        2. Автоматичний фініш (Сторінки -> Статус): Якщо користувач вказав поточну сторінку,
           яка дорівнює або перевищує загальну кількість сторінок, статус книги
           автоматично змінюється на 'read'.
        3. Авто-старт читання: При переході статусу в 'reading' автоматично фіксується
           поточна дата у `startDate` (якщо вона ще не була встановлена).
        4. Синхронізація завершення: При статусі 'read' автоматично встановлюється `endDate`.
           Якщо статус змінено на 'read' вручну (або через API), але сторінки не оновлені,
           метод примусово підтягує `currentPage` до максимуму та встановлює `progress` на 100%.

        Args:
            *args: Позиційні аргументи, що передаються в базовий метод `save` (наприклад, force_insert).
            **kwargs: Іменовані аргументи (наприклад, update_fields).

        Raises:
            Exception: У разі критичного збою при записі об'єкта в базу даних.
                       Помилка перехоплюється для логування (CRITICAL), після чого прокидається далі.
        """

        # ЗАПАМ'ЯТОВУЄМО СТАН ДО ЗБЕРЕЖЕННЯ 
        old_current_page = 0
        is_new = self.pk is None
        
        if not is_new:
            try:
                old_book = Book.objects.get(pk=self.pk)
                old_current_page = old_book.currentPage
            except Book.DoesNotExist:
                pass
            
        # Розрахунок відсоткового прогресу
        if self.totalPages and self.totalPages > 0:
            self.progress = min(100, round((self.currentPage / self.totalPages) * 100))
        else:
            self.progress = 0

        # Якщо сторінки дійшли до кінця, автоматично робимо книгу прочитаною
        if (
            self.totalPages
            and self.currentPage >= self.totalPages
            and self.totalPages > 0
        ):
            self.status = "read"

        # Автоматична дата початку (якщо почали читати)
        if self.status == "reading" and not self.startDate:
            self.startDate = timezone.now().date()
            logger.info(f"Book {self.id}: Start date set.")

        # Автоматична дата завершення (якщо статус 'read')
        if self.status == "read":
            if not self.endDate:
                self.endDate = timezone.now().date()

            # На випадок, якщо статус змінили вручну, але сторінки не підтягнули
            if self.totalPages and self.currentPage < self.totalPages:
                self.currentPage = self.totalPages
                self.progress = 100
                logger.info(f"Book {self.id}: Status 'read' forced full progress.")

        try:
            super().save(*args, **kwargs)
            
            # АВТОМАТИЧНЕ ЛОГУВАННЯ СЕСІЇ 
            delta_pages = self.currentPage - old_current_page
            
            # Якщо користувач прочитав хоча б 1 сторінку, автоматично створюємо сесію
            if delta_pages > 0:
                ReadingSession.objects.create(
                    book=self,
                    pages_read=delta_pages,
                    duration=0  # За замовчуванням 0, якщо не передано з фронтенду
                )
                
        except Exception as e:
            logger.critical(f"DB Error: {str(e)}")
            raise e

    def __str__(self):
        """Повертає рядкове представлення книги.

        Returns:
            str: Рядок у форматі "Назва by Автор (email користувача)".

        """
        return f"{self.title} by {self.author} ({self.user.email})"


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

    book = models.ForeignKey(
        Book, on_delete=models.CASCADE, related_name="reading_sessions"
    )
    date = models.DateTimeField(auto_now_add=True)
    pages_read = models.IntegerField(default=0, help_text="Кількість прочитаних сторінок за сесію")
    duration = models.IntegerField(help_text="Тривалість у секундах", null=True, blank=True, default=0)
    note = models.TextField(blank=True, null=True)
    quote = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ["-date"] # Найновіші сесії зверху

    def __str__(self):
        """Повертає рядкове представлення сесії читання.

        Returns:
            str: Рядок із зазначенням назви книги та дати сесії.

        """
        return f"+{self.pages_read} pages for {self.book.title} on {self.date.strftime('%Y-%m-%d')}"


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

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="book_notes")
    content = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    isFavorite = models.BooleanField(default=False)

    def __str__(self):
        """Повертає рядкове представлення нотатки.

        Returns:
            str: Рядок із зазначенням назви книги, до якої належить нотатка.

        """
        return f"Note on {self.book.title}"


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

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="quotes")
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="book_quotes")
    content = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    isFavorite = models.BooleanField(default=False)

    def __str__(self):
        """Повертає рядкове представлення цитати.

        Returns:
            str: Рядок із зазначенням назви книги, з якої взято цитату.

        """
        return f"Quote from {self.book.title}"


class ReadingCycle(models.Model):
    book = models.ForeignKey(
        Book, on_delete=models.CASCADE, related_name="reading_cycles"
    )
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        ordering = ["-end_date"]  # Останні прочитані будуть зверху

    def __str__(self):
        return f"{self.book.title}: {self.start_date} - {self.end_date}"
