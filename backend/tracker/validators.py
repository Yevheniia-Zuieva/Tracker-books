"""Модуль містить користувацькі валідатори для перевірки даних.
Включає валідатор складності пароля.
"""
import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class ComplexPasswordValidator:
    """Валідатор перевіряє наявність цифр, великих літер та спецсимволів."""

    def validate(self, password, user=None):
        """Перевіряє переданий пароль на відповідність вимогам складності.

        Args:
            password (str): Пароль, введений користувачем.
            user (User, optional): Об'єкт користувача (за замовчуванням None).

        Raises:
            ValidationError: Якщо пароль не містить великої літери, цифри 
                             або спеціального символу.

        """        # Перевірка на велику літеру
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Пароль повинен містити хоча б одну велику літеру."),
                code='password_no_upper',
            )
        # Перевірка на цифру
        if not re.search(r'\d', password):
            raise ValidationError(
                _("Пароль повинен містити хоча б одну цифру."),
                code='password_no_number',
            )
        # Перевірка на спецсимвол
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
             raise ValidationError(
                _("Пароль повинен містити хоча б один спеціальний символ."),
                code='password_no_symbol',
            )

    def get_help_text(self):
        """Повертає текст підказки з описом вимог до пароля.

        Returns:
            str: Рядок з інструкцією щодо створення пароля.

        """
        return _(
            "Пароль не відповідає вимогам. Пароль має бути не менше 8 символів і "
            "містити великі та малі літери, цифри, а також спеціальні символи. "
            "Будь ласка, спробуйте ще раз."
        )