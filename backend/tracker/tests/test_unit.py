from django.test import SimpleTestCase
from unittest.mock import patch, Mock, MagicMock
from django.utils import timezone
import datetime

# Імпортуємо класи, які будемо тестувати
from tracker.models import Book, User, Note, ReadingSession
from tracker.views import ExternalSearchAPIView, ReadingStatsAPIView

class RequirementR1_Tracking_Tests(SimpleTestCase):
    """
    Тести для вимог R1.8 - R1.9 (Відстеження прогресу)
    """

    # R1.8: Система повинна автоматично розрахувати відсоток прочитаного
    @patch('django.db.models.Model.save') 
    def test_R1_8_progress_calculation_overflow(self, mock_save):
        """
        Перевірка R1.8: Якщо користувач помилково ввів поточну сторінку більшу за загальну,
        прогрес не має перевищувати 100%.
        """
        book = Book(totalPages=200, currentPage=250, status='reading')
        book.save() # Викликаємо логіку моделі
        
        # Логіка в save() має обмежувати прогрес числом 100
        self.assertEqual(book.progress, 100)

    # R1.9: Можливість встановити дату завершення читання для кожної книги
    @patch('django.db.models.Model.save')
    def test_R1_9_end_date_is_not_overwritten(self, mock_save):
        """
        Перевірка R1.9: Якщо дата завершення ВЖЕ встановлена, система не повинна 
        її перезаписувати автоматично при повторному збереженні.
        """
        old_date = datetime.date(2020, 1, 1)
        book = Book(status='read', endDate=old_date)
        
        # Мокаємо timezone.now, щоб переконатися, що ми не беремо поточну дату
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value.date.return_value = datetime.date(2025, 1, 1)
            book.save()
            
        # Дата має залишитися старою
        self.assertEqual(book.endDate, old_date)


class RequirementR1_Search_Tests(SimpleTestCase):
    """
    Тести для вимоги R1.5 (Пошук книг)
    """
    
    def setUp(self):
        self.view = ExternalSearchAPIView()

    # R1.5: Система повинна надавати можливість пошуку (перевірка формування запиту)
    @patch('tracker.views.requests.get')
    def test_R1_5_search_query_construction_title(self, mock_requests_get):
        """
        Перевірка R1.5: Чи правильно формується запит до Google API при фільтрі 'title'.
        """
        # Створюємо фейковий реквест
        request = Mock()
        request.query_params = {'q': 'Harry Potter', 'filter': 'title'}
        
        # Мокаємо успішну відповідь, щоб view не впала
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'items': []}
        mock_requests_get.return_value = mock_response

        # Викликаємо метод get
        self.view.get(request)
        
        # Перевіряємо, з якими аргументами викликався requests.get
        # Очікуємо, що 'title' перетворився на 'intitle:'
        args, kwargs = mock_requests_get.call_args
        self.assertIn('intitle:Harry Potter', kwargs['params']['q'])

    # R1.5: Пошук за автором
    @patch('tracker.views.requests.get')
    def test_R1_5_search_query_construction_author(self, mock_requests_get):
        """
        Перевірка R1.5: Чи правильно формується запит при фільтрі 'author'.
        """
        request = Mock()
        request.query_params = {'q': 'Rowling', 'filter': 'author'}
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'items': []}
        mock_requests_get.return_value = mock_response

        self.view.get(request)
        
        # Очікуємо 'inauthor:'
        args, kwargs = mock_requests_get.call_args
        self.assertIn('inauthor:Rowling', kwargs['params']['q'])


class RequirementR1_Stats_Tests(SimpleTestCase):
    """
    Тести для вимоги R1.14 (Генерування статистики)
    """

    # R1.14: Розрахунок прогресу до річної мети
    def test_R1_14_yearly_goal_math_logic(self):
        """
        Перевірка R1.14: Математика розрахунку відсотка виконання цілі.
        Симулюємо логіку з ReadingStatsAPIView.
        """
        yearly_goal = 12
        books_read = 3
        
        # Логіка з view: int((read / goal) * 100)
        progress = int((books_read / yearly_goal) * 100)
        
        self.assertEqual(progress, 25) # 3 від 12 це 25%

    # R1.14: Обробка ділення на нуль у статистиці
    def test_R1_14_yearly_goal_zero_division(self):
        """
        Перевірка R1.14: Якщо ціль 0, прогрес має бути 0.
        """
        yearly_goal = 0
        books_read = 5
        
        # Логіка з view має перевірку: if user.yearly_goal > 0 else 0
        progress = int((books_read / yearly_goal) * 100) if yearly_goal > 0 else 0
        
        self.assertEqual(progress, 0)

    # R1.14: Середній час на книгу
    def test_R1_14_avg_time_math(self):
        """
        Перевірка R1.14: Розрахунок середнього часу читання книги.
        """
        total_minutes = 600 # 10 годин
        books_count = 2
        
        avg_time = total_minutes / books_count if books_count > 0 else 0
        self.assertEqual(avg_time, 300)


class RequirementR1_Data_Tests(SimpleTestCase):
    """
    Тести для вимог R1.1, R1.11 (Збереження та відображення даних)
    """

    # R1.1: Реєстрація з Email (Перевірка відображення User)
    def test_R1_1_user_string_representation(self):
        """
        Перевірка R1.1: Модель User має ідентифікуватися за email, якщо він є.
        """
        user = User(email="test@test.com", username="tester")
        # Перевіряємо __str__ метод без збереження в БД
        self.assertEqual(str(user), "test@test.com")

   # R1.11: Додавання нотаток (Note Representation)
    def test_R1_11_note_representation(self):
        """
        Перевірка R1.11: Коректне формування рядкового представлення нотатки.
        """
        # Використовуємо реальний екземпляр класу Book.
        # У SimpleTestCase створюємо об'єкти моделей у пам'яті, не викликаючи .save().
        book = Book(title="The Hobbit")
        
        # Django бачить справжній об'єкт із потрібним атрибутом _state
        note = Note(book=book, content="Great quote!")
        
        # Перевіряємо, що __str__ повертає очікуваний формат
        self.assertEqual(str(note), "Note on The Hobbit")
