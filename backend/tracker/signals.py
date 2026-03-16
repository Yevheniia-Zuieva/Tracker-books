"""Модуль містить обробники сигналів Django для автоматизації дій,
пов'язаних з моделями бази даних (наприклад, відправка листів).
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """Обробник сигналу post_save для моделі User.
    Відправляє вітальний електронний лист під час реєстрації нового користувача.

    Args:
        sender (Model): Клас моделі, що відправив сигнал (User).
        instance (User): Екземпляр збереженого користувача.
        created (bool): Прапорець, що вказує, чи було створено новий запис.
        **kwargs: Додаткові аргументи, передані сигналом.

    """
    if created: # Перевіряємо, що це саме створення, а не редагування профілю
        subject = 'Ласкаво просимо до Tracker Books!'
        message = (
            f'Вітаємо, {instance.username or instance.email}!\n\n'
            'Ви успішно зареєструвалися в нашому сервісі. '
            'Бажаємо приємного ведення читацького щоденника!'
        )
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [instance.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Помилка відправки листа: {e}")