#!/usr/bin/env python
"""
Вхідний скрипт для керування проєктом Tracker Books через командний рядок.

Цей модуль є стандартною утилітою Django, яка виконує роль проксі-інтерфейсу
для виконання адміністративних завдань. Він забезпечує:
1. Налаштування середовища (шлях до `settings.py`).
2. Взаємодію з базою даних (міграції).
3. Запуск сервера розробки.
4. Виконання модульних тестів та кастомних команд керування.

Усі команди виконуються через термінал у форматі: `python manage.py [command]`.
"""
import os
import sys


def main():
    """
    Головна функція ініціалізації адміністративних завдань.

    Виконує наступні кроки:
    1. Встановлює `DJANGO_SETTINGS_MODULE` для вказівки конфігурації проєкту.
    2. Перевіряє наявність встановленого фреймворку Django у поточному оточенні.
    3. Передає аргументи командного рядка (`sys.argv`) системному обробнику Django.

    Raises:
        ImportError: Виникає, якщо Django не встановлено в системі або
            не активовано віртуальне середовище (venv).
    """

    # Реєстрація шляху до файлу налаштувань.
    # У даному проекті це 'backend.settings'.
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    # Запуск обробника команд із переданими аргументами
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
