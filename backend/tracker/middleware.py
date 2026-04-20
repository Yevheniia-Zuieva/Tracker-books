"""Модуль глобальної обробки винятків та помилок.

Цей модуль реалізує механізм Middleware, який інтегрується в цикл запит-відповідь 
Django. Він забезпечує дві ключові функції:
1. **Application Performance Monitoring (APM)**: вимірювання часу виконання запитів 
   та виявлення повільних ендпоінтів.
2. **Централізована обробка помилок**: перехоплення непередбачуваних винятків, 
   їх логування з унікальними ID та повернення дружніх до фронтенду JSON-відповідей.
"""

import logging
import time
import traceback
import uuid

from django.conf import settings
from django.http import JsonResponse

# Ініціалізація системного логера застосунку
logger = logging.getLogger('tracker')

class ExceptionLoggingMiddleware:
    """Middleware для гарантованого перехоплення та логування винятків.

    Відповідає за:
    1. Перехоплення будь-яких помилок (500 Internal Server Error).
    2. Генерацію унікального ідентифікатора помилки (Error ID).
    3. Збір контекстної інформації (користувач, маршрут, параметри).
    4. Запис детального трейсу в систему логування.
    5. Формування безпечної JSON-відповіді для фронтенду.
    """

    def __init__(self, get_response):
        """Ініціалізація екземпляру middleware.

        Args:
            get_response (callable): Функція, що представляє наступний крок у ланцюжку Django.
        """
        self.get_response = get_response

    def __call__(self, request):
        """
        Обробляє вхідний запит та проводить аудит продуктивності.

        Метод заміряє час виконання запиту. Якщо тривалість перевищує 
        встановлений поріг (500 мс), запис у логах позначається як WARNING 
        для подальшої оптимізації розробниками.

        Args:
            request (HttpRequest): Об'єкт вхідного HTTP-запиту.

        Returns:
            HttpResponse: Об'єкт відповіді, отриманий від наступних шарів системи.
        """
        # Фіксація часу старту для APM
        start_time = time.time()

        # Логування вхідного запиту для аудиту безпеки
        logger.info(f"Request: {request.method} {request.get_full_path()} from {request.META.get('REMOTE_ADDR')}")
        
        response = self.get_response(request)

        # Розрахунок тривалості обробки в мілісекундах
        duration = (time.time() - start_time) * 1000  
        
        # Формування метрики продуктивності
        log_message = (
            f"Performance Metrics | Path: {request.path} | "
            f"Method: {request.method} | Duration: {duration:.2f}ms | "
            f"Status: {response.status_code} | User ID: {request.user.id if request.user.is_authenticated else 'Anon'}"
        )

        # Перевірка порогу продуктивності
        if duration > 500: 
            logger.warning(f"SLOW_ENDPOINT detected: {log_message}")
        else:
            logger.info(log_message)
            
        return response

    def process_exception(self, request, exception):
        """Обробник непередбачуваних винятків.

        Викликається Django автоматично, якщо у view виникла помилка, 
        яка не була оброблена блоком try-except. Метод автоматично генерує інцидент-код (UUID), збирає повний контекст 
        (URL, параметри, ID користувача) та формує локалізовану відповідь. 
        Це запобігає «падінню» фронтенду через некоректний формат HTML-помилок.

        Args:
            request (HttpRequest): Запит, під час обробки якого сталася помилка.
            exception (Exception): Об'єкт винятку, що був згенерований з деталями помилки.

        Returns:
            JsonResponse: Сформована JSON-відповідь зі статусом 500. 
            Містить ключі: `error_id`, `message`, `suggested_actions`.
            У режимі DEBUG додаються `details` та `traceback`.
        """
        # Генерація унікального токена інциденту
        # Використання перших 8-ми символів UUID для зручності пошуку в логах
        error_id = str(uuid.uuid4())[:8] 
        
        # Збираємо контекстну інформацію про стан системи на момент збою
        user_id = request.user.id if request.user.is_authenticated else "Anonymous"
        
        context = {
            "error_id": error_id,
            "path": request.path,
            "full_url": request.build_absolute_uri(),
            "method": request.method,
            "user_id": user_id,
            "session_key": request.session.session_key,
            "query_params": dict(request.GET),
        }

        # Логування з повним стеком викликів для налагодження
        logger.error(
            f"Unhandled Exception [{error_id}]: {str(exception)} | Context: {context}",
            exc_info=True  
        )

        # Визначення мови інтерфейсу для локалізації повідомлення
        lang = getattr(request, 'LANGUAGE_CODE', 'uk')[:2]

        translations = {
            'uk': {
                'error': "Упс! Щось пішло не так на нашому боці.",
                'msg': "Ми вже отримали сповіщення про проблему і працюємо над її вирішенням.",
                'actions': [
                    "Спробуйте оновити сторінку через хвилину.",
                    "Перевірте ваше інтернет-з'єднання.",
                    "Поверніться на головну сторінку бібліотеки."
                ],
                'support': "Будь ласка, повідомте цей код підтримці: "
            },
            'en': {
                'error': "Oops! Something went wrong on our end.",
                'msg': "We've been notified and are working on a fix.",
                'actions': [
                    "Try refreshing the page in a minute.",
                    "Check your internet connection.",
                    "Return to the library home page."
                ],
                'support': "Please provide this code to support: "
            }
        }

        # Вибир перекладу (якщо мова не uk/en, беремо uk)
        t = translations.get(lang, translations['uk'])

        # Формування відповіді для користувача
        error_message = {
            "status": "error",
            "error_id": error_id,
            "error": t['error'],
            "message": t['msg'],
            "suggested_actions": t['actions'],
            "support_info": {
                "contact_email": "y.zuyeva@student.sumdu.edu.ua",
                "instruction": f"{t['support']}{error_id}"
            }
        }

        # Додавання розширених даних для розробника у середовищі розробки (якщо DEBUG = True)
        if settings.DEBUG:
            error_message["details"] = str(exception)
            error_message["traceback"] = traceback.format_exc()

        # Повернення стандартизованої JSON-відповіді із HTTP статусом 500
        return JsonResponse(error_message, status=500)