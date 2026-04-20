"""
Модуль обробки системних сигналів (Signals Dispatcher).

Цей модуль реалізує паттерн 'Спостерігач' для автоматизації фонових завдань
залежно від змін у стані моделей бази даних. Основним призначенням є
відокремлення основної бізнес-логіки від побічних ефектів, таких як
відправка поштових сповіщень або ініціалізація профілів.
"""

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver

# Отримання поточної моделі користувача, визначеної в налаштуваннях
User = get_user_model()

# Ініціалізація логера для фіксації результатів відправки повідомлень
logger = logging.getLogger("tracker")


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """Обробник сигналу post_save для моделі User.
    Відправляє вітальний електронний лист під час реєстрації нового користувача.
    Використовує сигнал `post_save` для відправки привітального листа
    одразу після того, як запис про нового користувача буде успішно
    зафіксований у базі даних.

    Args:
        sender (Model): Клас моделі, що відправив сигнал (User).
        instance (User): Екземпляр збереженого користувача.
        created (bool): Логічний прапорець. `True`, якщо створено новий запис,
            `False` — якщо відбулося оновлення існуючого.
        **kwargs: Додаткові аргументи, передані сигналом.

    """
    if created:  # Перевірка, що це саме створення, а не редагування профілю
        subject = "Ласкаво просимо до Tracker Books!"
        message = (
            f"Вітаємо, {instance.username or instance.email}!\n\n"
            "Ви успішно зареєструвалися в нашому сервісі. "
            "Бажаємо приємного ведення читацького щоденника!"
        )

        try:
            # Спроба відправки листа через сконфігурований SMTP-сервер
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [instance.email],
                fail_silently=False,
            )
            logger.info(f"Email Success: Welcome letter sent to {instance.email}")
        except Exception as e:
            # Логування помилки без зупинки основного потоку виконання програми
            logger.error(
                f"Email Failure: Failed to send welcome letter to {instance.email}. "
                f"Reason: {str(e)}",
                exc_info=True,
            )
