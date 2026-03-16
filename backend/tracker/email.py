"""
Модуль містить кастомні класи електронних листів для бібліотеки Djoser.
"""
from djoser import email


class CustomPasswordResetEmail(email.PasswordResetEmail):
    """
    Кастомний клас для відправки листа скидання пароля.
    
    Перевизначає стандартний метод Djoser для впровадження користувацьких
    змінних контексту, таких як URL фронтенду.
    """
    def get_context_data(self):
        """
        Формує контекстні змінні для шаблону електронного листа.

        Returns:
            dict: Словник зі змінними контексту (включаючи domain та site_name).
        """
        context = super().get_context_data()
        
        context['domain'] = 'localhost:5173'
        context['site_name'] = 'Tracker Books'
        
        return context