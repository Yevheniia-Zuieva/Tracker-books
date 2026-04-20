"""
Конфігураційний модуль застосунку `tracker`.

Цей модуль містить клас `TrackerConfig`, який Django використовує для
ініціалізації застосунку, налаштування метаданих та виконання коду
під час запуску сервера.
"""

import logging

from django.apps import AppConfig

# Ініціалізація логера для відстеження стану готовності застосунку
logger = logging.getLogger("tracker")


class TrackerConfig(AppConfig):
    """
    Клас конфігурації застосунку Tracker.

    Визначає системні параметри застосунку, такі як тип автоматичного
    створення первинних ключів та логіку ініціалізації при старті.

    Attributes:
        default_auto_field (str): Тип поля для автоматичних ID за замовчуванням.
        name (str): Унікальне ім'я застосунку в проекті.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "tracker"

    def ready(self):
        """
        Метод, що викликається після повної реєстрації застосунку.

        Використовується для виконання ініціалізаційних дій.
        """
        logger.info("Application 'tracker' is initialized and ready.")
