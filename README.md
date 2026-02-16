# TRACKER BOOKS

**Tracker Books** – це сучасна вебплатформа для менеджменту особистої бібліотеки. Додаток допомагає організувати процес читання та аналізувати власну активність.

### Основні можливості
* Відстежувати прогрес читання.
* Додавати нові книги до списків.
* Керувати статусами прочитаного.
* Аналізувати читацьку активність.

---

## Стек технологій

### Backend
* **Python 3.12+** & **Django 6.0.2**
* **Django REST Framework 3.16.1** – для побудови API.
* **Djoser** & **SimpleJWT 5.5.1** – автентифікація користувачів.
* **Pillow 12.1.0** – обробка зображень.
* **Django CORS Headers 4.9.0** – налаштування доступу для фронтенду.

### Frontend & UI
* **React 19.x** (з використанням **Vite 7.x** для швидкої збірки).
* **Tailwind CSS 4.x** – сучасна стилізація компонентів.

### Інше
* **База даних:** SQLite (легка та швидка для розробки).
* **Тестування:** Django TestCase (Unit та API-тести).

---

## Структура проєкту

| Шлях | Опис |
| :--- | :--- |
| `/backend` | Серверна частина додатка на Django |
| `/backend/tracker` | Основний модуль із бізнес-логікою (моделі, серіалізатори, views) |
| `/backend/tests` | Набори автоматизованих тестів |
| `/frontend` | Клієнтська частина на React |
| `/frontend/src/api` | Сервіси для взаємодії з API |
| `/frontend/src/components` | UI-компоненти та сторінки застосунку |

---

## Встановлення та запуск

### 1. Налаштування Backend
```bash
cd backend

# 1. Створення та активація віртуального середовища
python -m venv venv
source venv/bin/activate  # для macOS/Linux
venv\Scripts\activate     # для Windows

# 2. Встановлення залежностей
pip install -r requirements.txt
```
Налаштування оточення. 
Створіть файл .env у папці backend/ та додайте ваші ключі::

```bash
SECRET_KEY=your_secret_key
DEBUG=True
GOOGLE_BOOKS_API_KEY=your_api_key
EMAIL_USER=your_email
EMAIL_PASS=your_password
```
Запуск бази даних та сервера:
```bash
python manage.py migrate
python manage.py runserver
```
### 2. Налаштування Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Тестування
Проєкт підтримує автоматичне тестування API та бізнес-логіки.

Для запуску тестів бекенду:
```bash
python manage.py test tracker
```

---

## Ліцензія
Проєкт розповсюджується під ліцензією MIT. Повний текст доступний у файлі LICENSE.

---

## Розробник: Yevheniia Zuieva
