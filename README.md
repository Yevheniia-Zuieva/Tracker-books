TRACKER BOOKS

Tracker books — це вебплатформа для менеджменту особистої бібліотеки. Додаток дозволяє відстежувати прогрес читання, додавати нові книги до списків та керувати статусами прочитаного.

~~~~~ Стек технологій ~~~~~

Проєкт розроблений із використанням сучасних інструментів:
~ Backend: Python 3.12+, Django 6.0.2, Django REST Framework 3.16.1, Djoser & SimpleJWT 5.5.1, Pillow 12.1.0, Django Cors Headers 4.9.0.
~ Frontend: React 19.x, Vite 7.x.
~ Стилізація: Tailwind CSS 4.x.
~ База даних: SQLite.
~ Тестування: Django TestCase (API та Unit-тести).

~~~~~ Структура проєкту ~~~~~

/backend — серверна частина додатка на Django.
/tracker — основний модуль із бізнес-логікою (моделі, API серіалізатори, види).
/tests — набори автоматизованих тестів.
/frontend — клієнтська частина на React.
/src/api — сервіси для взаємодії з API.
/src/components — інтерфейсні компоненти та сторінки.

~~~~~ Встановлення та запуск ~~~~~

Перед запуском бекенду створіть файл .env у папці backend/ та додайте: SECRET_KEY, DEBUG, GOOGLE_BOOKS_API_KEY, EMAIL_USER та EMAIL_PASS.

1. Налаштування Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

2. Налаштування Frontend
cd frontend
npm install
npm run dev

~~~~~ Тестування ~~~~~

Проєкт підтримує автоматичне тестування інтерфейсу та API. Для локального запуску тестів використовуйте:
Backend: python manage.py test tracker.

~~~~~ Ліцензія ~~~~~

Проєкт розповсюджується під ліцензією MIT. Повний текст доступний у файлі LICENSE.

Розробник: Yevheniia Zuieva