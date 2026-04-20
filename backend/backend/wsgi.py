"""
Модуль конфігурації WSGI для проєкту Tracker Books.

Він експортує об'єкт `application` рівня модуля як змінну з назвою `application`.
WSGI (Web Server Gateway Interface) є стандартним інтерфейсом між вебсервером 
та Python-застосунком.

Документація Django щодо цього файлу:
https://docs.djangoproject.com/en/stable/howto/deployment/wsgi/
"""
import os

from django.core.wsgi import get_wsgi_application

# Встановлення змінної оточення для налаштувань Django за замовчуванням.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

#: Об'єкт WSGI-застосунку, що використовується серверами для обробки запитів.
application = get_wsgi_application()