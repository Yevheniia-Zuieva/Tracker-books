from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created: # Перевіряємо, що це саме створення, а не редагування профілю
        subject = 'Ласкаво просимо до Tracker Books!'
        message = f'Вітаємо, {instance.username or instance.email}!\n\nВи успішно зареєструвалися в нашому сервісі. Бажаємо приємного ведення читацького щоденника!'
        
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