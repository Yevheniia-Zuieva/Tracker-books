"""Модуль глобальної обробки винятків та помилок.

Цей модуль містить Middleware для перехоплення непередбачуваних 
помилок на рівні всього застосунку. Забезпечує їх логування 
з унікальними ідентифікаторами та повернення клієнту стандартизованої
JSON-відповіді замість стандартних HTML-сторінок помилок Django.
"""

import logging
import time
import traceback
import uuid

from django.conf import settings
from django.http import JsonResponse

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
        """Ініціалізація middleware.

        Args:
            get_response (callable): Наступний middleware або view у ланцюжку 
                                     обробки запитів Django.
        """
        self.get_response = get_response

    def __call__(self, request):
        """Обробка вхідного HTTP-запиту.

        Пропускає запит далі по ланцюжку. Якщо виникає помилка 
        на етапі виконання view, Django автоматично викличе `process_exception`.

        Args:
            request (HttpRequest): Об'єкт поточного HTTP-запиту.

        Returns:
            HttpResponse: Відповідь від наступних шарів застосунку.
        """
        # --- APM: Початок заміру продуктивності ---
        start_time = time.time()

        # Логування запиту (Request)
        logger.info(f"Request: {request.method} {request.get_full_path()} from {request.META.get('REMOTE_ADDR')}")
        
        response = self.get_response(request)

        # --- APM: Завершення заміру продуктивності ---
        duration = (time.time() - start_time) * 1000  # Переводимо в мілісекунди
        
        # Визначаємо рівень важливості залежно від швидкості
        log_message = (
            f"Performance Metrics | Path: {request.path} | "
            f"Method: {request.method} | Duration: {duration:.2f}ms | "
            f"Status: {response.status_code} | User ID: {request.user.id if request.user.is_authenticated else 'Anon'}"
        )

        if duration > 500: # Поріг для "повільних" запитів
            logger.warning(f"SLOW_ENDPOINT detected: {log_message}")
        else:
            logger.info(log_message)
            
        return response

    def process_exception(self, request, exception):
        """Обробник непередбачуваних винятків.

        Викликається Django автоматично, якщо у view виникла помилка, 
        яка не була оброблена блоком try-except.

        Args:
            request (HttpRequest): Запит, під час обробки якого сталася помилка.
            exception (Exception): Об'єкт винятку, що був згенерований.

        Returns:
            JsonResponse: Сформована відповідь зі статусом 500. Містить 
                          деталі помилки у режимі DEBUG, або безпечне 
                          повідомлення у режимі Production.
        """
        # 1. Створюємо унікальний ідентифікатор помилки (Error ID)
        # Використовуємо перші 8 символів UUID для зручності пошуку в логах
        error_id = str(uuid.uuid4())[:8] 
        
        # 2. Збираємо контекстну інформацію про стан системи на момент збою
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

        # 3. Логуємо критичну помилку з повним контекстом
        # exc_info=True гарантує, що в лог буде записано повний Traceback (стек викликів)
        logger.error(
            f"Unhandled Exception [{error_id}]: {str(exception)} | Context: {context}",
            exc_info=True  
        )

        # Ручна локалізація
        # Отримуємо мову (встановлюється LocaleMiddleware)
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

        # Вибираємо переклад (якщо мова не uk/en, беремо uk)
        t = translations.get(lang, translations['uk'])

        # 4. Формуємо відповідь для користувача
        error_message = {
            "status": "error",
            "error_id": error_id,
            "error": t['error'],
            "message": t['msg'],
            "suggested_actions": t['actions'],
            "support_info": {
                "contact_email": "support@trackerbooks.com",
                "instruction": f"{t['support']}{error_id}"
            }
        }

        # 5. Розширення контексту для розробника (якщо DEBUG = True)
        if settings.DEBUG:
            error_message["details"] = str(exception)
            error_message["traceback"] = traceback.format_exc()

        # Повертаємо стандартизовану JSON-відповідь із HTTP статусом 500
        return JsonResponse(error_message, status=500)