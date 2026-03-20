import random

from django.core.management.base import BaseCommand

from tracker.models import Book, Note, Quote, User


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        self.stdout.write("Початок генерації даних...")

        #  Створюємо користувачів (50)
        users = []
        for i in range(50):
            # Використовуємо email як username 
            email = f"perf_user_{i}@example.com"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'username': f"user_{i}"}
            )
            if created:
                user.set_password("password123")
                user.save()
            users.append(user)

        # Список фейкових авторів для текстового поля
        fake_authors = [f"Автор {i}" for i in range(50)]

        # творюємо книги (1000) - по 20 на кожного користувача
        all_books = []
        for user in users:
            for i in range(20):
                book = Book(
                    user=user,
                    title=f"Книга {i} для {user.username}",
                    author=random.choice(fake_authors),
                    genre=random.choice(['Фантастика', 'Детектив', 'Драма', 'Наука']),
                    status=random.choice(['reading', 'read', 'want-to-read']),
                    totalPages=random.randint(200, 500),
                    currentPage=random.randint(0, 200)
                )
                all_books.append(book)
        
        # Використовуємо bulk_create для швидкості
        Book.objects.bulk_create(all_books)
        
        # Отримуємо всі створені книги з бази для прив'язки нотаток
        db_books = list(Book.objects.all())

        # Створюємо нотатки та цитати (5000 разом)
        notes = []
        quotes = []
        for _ in range(2500):
            target_book = random.choice(db_books)
            notes.append(Note(
                user=target_book.user,
                book=target_book,
                content="Це тестова нотатка для профілювання продуктивності."
            ))
            
            target_book_q = random.choice(db_books)
            quotes.append(Quote(
                user=target_book_q.user,
                book=target_book_q,
                content="Це тестова цитата, яку ми зберегли для тесту."
            ))

        Note.objects.bulk_create(notes)
        Quote.objects.bulk_create(quotes)

        self.stdout.write(self.style.SUCCESS(
            'Успішно створено: 50 користувачів, 1000 книг, 2500 нотаток та 2500 цитат.'
        ))