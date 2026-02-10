import json
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from unittest.mock import patch, MagicMock
from datetime import timedelta

# Отримання моделі користувача
User = get_user_model()

# URL АДРЕСИ 

REGISTER_URL = reverse('user-list') 
LOGIN_URL = reverse('jwt-create')      

class AuthAPITestCase(APITestCase):
    """Модульні тести для кінцевих точок авторизації."""

    def setUp(self):
        
        self.valid_password = "QA_User01!" # Валідний пароль для тестування
        
        # Створення першого користувача 
        self.test_user_data = {
            "username": "user01",
            "email": "user01@gmail.com",
            "password": self.valid_password
        }
        
        self.user = User.objects.create_user(
            username=self.test_user_data['username'], 
            email=self.test_user_data['email'],
            password=self.test_user_data['password'],
        )
        
        
        # Отримання токена для подальших запитів (імітуємо вхід)
        # Для входу передаємо лише email та password
        login_response = self.client.post(LOGIN_URL, {
            "email": self.test_user_data['email'], 
            "password": self.test_user_data['password'],
            "username": self.test_user_data['username']
        }, format='json')
        
        self.assertEqual(login_response.status_code, 200)
        self.token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        
    def test_01_register_success(self):
        """1.1 Позитивна перевірка реєстрації нового користувача."""
        new_user_data = {
            "username": "user02",
            "email": "user02@gmail.com",
            "password": "QA_User02!",
            "re_password": "QA_User02!" 
        }
        response = self.client.post(REGISTER_URL, new_user_data, format='json')
        print("DEBUG:", response.data)   
        # Очікуємо 201 Created після успішної реєстрації
        self.assertEqual(response.status_code, 201)
        self.assertIn('id', response.data)
        self.assertTrue(User.objects.filter(email=new_user_data['email']).exists())

    def test_02_register_empty_fields(self):
        """1.2 Негативна перевірка: реєстрація з пустими полями."""
        data = {
            "username": "",
            "email": "",
            "password": "",
            "re_password": ""
        }
        response = self.client.post(REGISTER_URL, data, format='json')
        
        # Повертає 400, коли поля порожні.
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.data) 
        self.assertIn('password', response.data)
        self.assertIn('username', response.data)

    def test_03_register_user_already_exists(self):
        """1.3 Негативна перевірка: задана електронна пошта під час реєстрації вже існує."""
        data_existing_email = {
            "username": "user_duplicate",
            "email": self.test_user_data['email'], # user01@gmail.com (існує)
            "password": self.valid_password,
            "re_password": self.valid_password
        }
        
        response = self.client.post(REGISTER_URL, data_existing_email, format='json')
        
        self.assertEqual(response.status_code, 400)
        # Повертає, що email вже існує
        self.assertIn('email', response.data) 
        self.assertTrue(any("already exists" in str(err) for err in response.data['email']))

    def test_04_register_invalid_email_format(self):
        """1.4 Негативна перевірка: некоректне значення електронної пошти."""
        data = {
            "username": "user02",
            "email": "user02", # Некоректний формат email (без '@')
            "password": self.valid_password,
            "re_password": self.valid_password 
        }
        
        response = self.client.post(REGISTER_URL, data, format='json')
        
        self.assertEqual(response.status_code, 400)
        # Має повернути помилку валідації email
        self.assertIn('email', response.data)
        self.assertTrue(any("Enter a valid email address" in str(err) for err in response.data['email']))

    def test_05_register_weak_password_complexity(self):
        """1.5 Негативна перевірка: некоректне значення паролю (слабкий пароль)."""
        data = {
            "username": "user03",
            "email": "user03@gmail.com",
            "password": "aaa1b", 
            "re_password": "aaa1b"
        }
        
        response = self.client.post(REGISTER_URL, data, format='json')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.data)
        
        # Перевірка на типові помилки складності
        password_errors = str(response.data['password'])
        self.assertTrue("8 characters" in password_errors or "digit" in password_errors or "uppercase" in password_errors or "symbol" in password_errors)

    def test_06_login_success(self):
        """2.1 Позитивна перевірка авторизації (отримання JWT токена)."""
        login_data = {
            "email": self.test_user_data['email'],
            "password": self.test_user_data['password']
        }
        # Використовуємо URL, визначений у djoser
        response = self.client.post(LOGIN_URL, login_data, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_07_profile_update_goal(self):
        """3.2 Позитивна перевірка редагування профілю (зміна річної мети)."""
        # URL для профілю 
        profile_url = reverse('user-profile')
        
        update_data = {
            "yearly_goal": 50,
            "bio": "Updated bio for integration test"
        }
        
        response = self.client.patch(profile_url, update_data, format='json')
        
        self.assertEqual(response.status_code, 200)
        # Перевіряємо, чи оновились дані в БД
        self.user.refresh_from_db()
        self.assertEqual(self.user.yearly_goal, 50)
        self.assertEqual(self.user.bio, "Updated bio for integration test")

    @patch('tracker.views.requests.get')
    def test_08_external_search_integration(self, mock_get):
        """4.1 Позитивна перевірка: пошук книги через зовнішнє API (з моком)."""
        # Налаштовуємо Mock, щоб не робити реальний запит до Google
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "items": [
                {
                    "id": "123",
                    "volumeInfo": {
                        "title": "Mocked Book",
                        "authors": ["Mock Author"],
                        "description": "Test desc",
                        "pageCount": 100
                    }
                }
            ]
        }
        mock_get.return_value = mock_response

        search_url = reverse('external-search')
        response = self.client.get(search_url, {'q': 'Mocked', 'filter': 'title'})

        self.assertEqual(response.status_code, 200)
        # Перевіряємо, що наша View коректно розпарсила відповідь від Google
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], "Mocked Book")

    def test_09_add_book_success(self):
        """5.1 Позитивна перевірка: додавання книги до бібліотеки."""
        books_url = reverse('book-list') # 'book-list' генерується DefaultRouter
        
        new_book_data = {
            "title": "Book Test",
            "author": "Author Test",
            "genre": "Education",
            "status": "want-to-read",
            "totalPages": 300
        }
        
        response = self.client.post(books_url, new_book_data, format='json')
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['title'], "Integration Testing 101")
        # Перевіряємо, що книга прив'язалась до поточного юзера
        from tracker.models import Book
        self.assertTrue(Book.objects.filter(title="Integration Testing 101", user=self.user).exists())

    def test_10_add_session_updates_book_status(self):
        """
        6.6 + R1.10: Інтеграційний тест взаємодії компонентів.
        Додавання сесії читання повинно автоматично змінювати статус книги 
        з 'want-to-read' на 'reading'.
        """
        from tracker.models import Book
        
        # 1. Створюємо книгу зі статусом "Хочу прочитати"
        book = Book.objects.create(
            user=self.user,
            title="Status Change Test",
            author="Test Author",
            status="want-to-read",
            totalPages=200
        )
        
        # 2. Додаємо сесію читання через API
        sessions_url = reverse('session-list')
        session_data = {
            "book": book.id,
            "duration": 30, # хвилин
            "note": "Started reading today"
        }
        
        response = self.client.post(sessions_url, session_data, format='json')
        self.assertEqual(response.status_code, 201)
        
        # 3. Перевіряємо: статус книги в БД мав змінитись
        book.refresh_from_db()
        self.assertEqual(book.status, 'reading')
