"""Модуль глобальної обробки винятків та помилок.

Цей модуль містить Middleware для перехоплення непередбачуваних 
помилок на рівні всього застосунку. Забезпечує їх логування 
з унікальними ідентифікаторами та повернення клієнту стандартизованої
JSON-відповіді замість стандартних HTML-сторінок помилок Django.
"""

import logging
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
        return self.get_response(request)

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
            "method": request.method,
            "user_id": user_id,
            "query_params": dict(request.GET),
        }

        # 3. Логуємо критичну помилку з повним контекстом
        # exc_info=True гарантує, що в лог буде записано повний Traceback (стек викликів)
        logger.critical(
            f"Unhandled Exception [{error_id}]: {str(exception)} | Context: {context}",
            exc_info=True  
        )

        # 4. Формуємо базове інформативне повідомлення для користувача 
        # (без розкриття технічних деталей та вразливостей системи)
        error_message = {
            "error": "Виникла внутрішня помилка сервера.",
            "message": "Ми вже працюємо над її вирішенням.",
            "error_id": error_id, # Дозволяє користувачу передати ID у службу підтримки
        }

        # 5. Розширення контексту для розробника (якщо DEBUG = True)
        if settings.DEBUG:
            error_message["details"] = str(exception)
            error_message["traceback"] = traceback.format_exc()

        # Повертаємо стандартизовану JSON-відповідь із HTTP статусом 500
        return JsonResponse(error_message, status=500)