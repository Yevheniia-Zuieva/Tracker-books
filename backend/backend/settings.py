"""
Конфігураційний модуль (Settings) проєкту Tracker Books.

Цей модуль містить усі глобальні налаштування застосунку, включаючи
параметри безпеки, інтеграцію з базою даних, конфігурацію REST API (DRF),
автентифікацію через JWT та налаштування зовнішніх сервісів (Google Books API).

Більшість конфіденційних даних (ключі, паролі) завантажуються динамічно
через змінні оточення за допомогою бібліотеки `python-dotenv`.
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Завантаження секретних ключів із файлу .env
load_dotenv()

#: Базова директорія проєкту (корінь репозиторію)
BASE_DIR = Path(__file__).resolve().parent.parent

# --- ПАРАМЕТРИ БЕЗПЕКИ ---

#: Секретний ключ проєкту. Завантажується з середовища для захисту даних.
SECRET_KEY = os.getenv("SECRET_KEY")

#: Режим налагодження. Вмикає детальні звіти про помилки (False для Production).
DEBUG = os.getenv("DEBUG") == "True"

#: Список дозволених хостів, які можуть обслуговуватися застосунком.
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

# --- ВИЗНАЧЕННЯ ЗАСТОСУНКІВ ---

#: Список підключених модулів. Розділений на системні Django,
#: сторонні (REST, CORS, JWT) та власні (tracker).
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "tracker",  # Основний застосунок бібліотеки
    "rest_framework",  # Django REST Framework для побудови API
    "djoser",  # Автентифікація та реєстрація користувачів
    "corsheaders",  # Обробка крос-доменних запитів (CORS)
    "django.contrib.sites",
    "drf_spectacular",  # Генерація документації OpenAPI (Swagger)
    "debug_toolbar",  # Панель налагодження для розробника
]

#: Шлях до кастомної моделі користувача.
AUTH_USER_MODEL = "tracker.User"

# --- ШАР MIDDLEWARE ---

#: Стек проміжного програмного забезпечення.
#: Визначає порядок обробки HTTP-запитів та відповідей.
MIDDLEWARE = [
    "debug_toolbar.middleware.DebugToolbarMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "tracker.middleware.ExceptionLoggingMiddleware",  # Власний моніторинг помилок
]

#: Внутрішні IP-адреси для доступу до налагоджувальних інструментів.
INTERNAL_IPS = ["127.0.0.1"]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"


# --- БАЗА ДАНИХ ---

#: Конфігурація підключення до БД. Використовується SQLite для локальної розробки.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# --- ПОЛІТИКА ПАРОЛІВ ---

#: Список валідаторів складності паролів. Включає вбудовані правила
#: Django та кастомний `ComplexPasswordValidator`.
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {
            "min_length": 8,
        },
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
    {
        "NAME": "tracker.validators.ComplexPasswordValidator",
    },
]

DJOSER = {
    "USER_CREATE_PASSWORD_RETYPE": True,  # підтвердження пароля
    "LOGIN_FIELD": "email",
    "USERNAME_CHANGED_EMAIL_CONFIRMATION": True,
    "PASSWORD_CHANGED_EMAIL_CONFIRMATION": True,
    "SEND_CONFIRMATION_EMAIL": True,
    "SET_USERNAME_RETYPE": True,
    "SET_PASSWORD_RETYPE": True,
    "PASSWORD_RESET_CONFIRM_URL": "password-reset/{uid}/{token}",  # шаблон посилання для "Забули пароль"
    "USERNAME_RESET_CONFIRM_URL": "username/reset/confirm/{uid}/{token}",
    "ACTIVATION_URL": "activate/{uid}/{token}",
    "SEND_ACTIVATION_EMAIL": False,
    "SERIALIZERS": {},
    "EMAIL": {
        "password_reset": "tracker.email.CustomPasswordResetEmail",
    },
}

# --- REST FRAMEWORK ТА АВТЕНТИФІКАЦІЯ ---

#: Налаштування Django REST Framework.
#: Визначає JWT як основний метод захисту API та встановлює пагінацію.
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "UNICODE_JSON": True,
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",  # МАЄ БУТИ ТУТ
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

#: Параметри життєвого циклу токенів безпеки.
SIMPLE_JWT = {
    # Access Token живе 15 хвилин
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    # Refresh Token живе 1 добу
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,  # Видавати новий Refresh при кожному оновленні
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --- ЛОКАЛІЗАЦІЯ ТА МОВНІ ПАРАМЕТРИ ---

#: Мова інтерфейсу за замовчуванням для системних повідомлень.
LANGUAGE_CODE = "en-us"

#: Часовий пояс, у якому працює серверна частина застосунку.
TIME_ZONE = "UTC"

#: Прапорець активації системи перекладів Django (Internationalization).
USE_I18N = True

#: Прапорець використання механізму часових поясів для дат у БД.
USE_TZ = True


# --- СТАТИЧНІ ФАЙЛИ (Asset Management) ---

#: URL-адреса, за якою будуть доступні статичні ресурси (CSS, JS, Images).
STATIC_URL = "static/"

# --- СИСТЕМНІ НАЛАШТУВАННЯ МОДЕЛЕЙ ---

#: Тип поля для автоматичного створення первинних ключів (PK) у таблицях.
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- БЕЗПЕКА ТА КРОС-ДОМЕННІ ЗАПИТИ (CORS) ---

#: Список дозволених URL-адрес фронтенду для взаємодії з API.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

# --- ІНТЕГРАЦІЯ З ЗОВНІШНІМИ СЕРВІСАМИ ---

#: Приватний токен доступу до Google Books API. Завантажується з .env.
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY")

# --- КОНФІГУРАЦІЯ ЕЛЕКТРОННОЇ ПОШТИ (SMTP) ---

#: Визначає клас бекенду для обробки вихідних листів.
#: Використовується 'django.core.mail.backends.smtp.EmailBackend' для Production.
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

#: Адреса SMTP-сервера поштового провайдера (напр. Google).
EMAIL_HOST = "smtp.gmail.com"

#: Порт для з'єднання з поштовим сервером.
EMAIL_PORT = 587

#: Використання протоколу TLS для шифрування поштового трафіку.
EMAIL_USE_TLS = True

#: Обліковий запис (email), від імені якого здійснюється розсилка.
EMAIL_HOST_USER = os.getenv("EMAIL_USER")

#: Пароль застосунку або пароль до поштової скриньки.
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_PASS")

#: Текстове ім'я та адреса відправника за замовчуванням у заголовках листів.
DEFAULT_FROM_EMAIL = "Tracker Books <noreply@trackerbooks.com>"

#: ID поточного сайту для фреймворку 'django.contrib.sites'.
SITE_ID = 1

# --- АВТОМАТИЧНА ДОКУМЕНТАЦІЯ API (OpenAPI/Swagger) ---

#: Параметри генератора специфікації Swagger UI.
#: Включає опис API, версію та налаштування безпеки для JWT.
SPECTACULAR_SETTINGS = {
    "TITLE": "Book Tracker API",
    "DESCRIPTION": "API для управління бібліотекою та прогресом читання",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_PATCH": True,
    "COMPONENT_SPLIT_COMMAND": True,
    "SECURITY": [
        {
            "jwtAuth": [],
        }
    ],
    "APPEND_COMPONENTS": {
        "securitySchemes": {
            "jwtAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            }
        }
    },
}

# --- СИСТЕМА ЛОГУВАННЯ ТА ТЕЛЕМЕТРІЇ ---

#: Визначає рівень деталізації логів. Завантажується з середовища (за замовчуванням INFO).
LOG_LEVEL = os.getenv("DJANGO_LOG_LEVEL", "INFO").upper()

#: Шлях до директорії збереження файлів журналів подій.
LOGS_DIR = os.path.join(BASE_DIR, "logs")
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

#: Конфігурація обробників (Handlers) та записувачів (Loggers).
#: Підтримує циклічну перезапис файлів (RotatingFileHandler) та вивід у консоль.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{asctime} [{levelname}] [{name}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file": {
            "level": LOG_LEVEL,
            "class": "logging.handlers.RotatingFileHandler",
            "filename": os.path.join(LOGS_DIR, "tracker_books.log"),
            "formatter": "verbose",
            "maxBytes": 1024 * 1024 * 5,  # 5MB
            "backupCount": 5,
            "encoding": "utf-8",
        },
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": True,
        },
        "tracker": {  # Власний логер
            "handlers": ["console", "file"],
            "level": LOG_LEVEL,
            "propagate": True,
        },
    },
}

# --- НАЛАШТУВАННЯ МУЛЬТИМОВНОСТІ (Locale) ---

#: Активна локалізація інтерфейсу.
LANGUAGE_CODE = "uk"

# Список мов, які підтримує застосунок
LANGUAGES = [
    ("uk", "Ukrainian"),
    ("en", "English"),
]

#: Увімкнення механізму перекладів текстових констант.
USE_I18N = True

#: Увімкнення локального форматування чисел, дат та валют.
USE_L10N = True

#: Увімкнення підтримки часових поясів для об'єктів datetime.
USE_TZ = True

# === НАЛАШТУВАННЯ ДЛЯ МЕДІА (Аватарів) ===
# URL, який буде додаватися до шляху картинки 
MEDIA_URL = '/media/' 

# Фізичний шлях на диску, куди Django буде зберігати файли
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')