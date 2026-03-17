# Production Deployment Guide (Інструкція з розгортання)

Цей документ призначений для **Release Engineers** та **DevOps-фахівців**. Він описує процес підготовки, налаштування та запуску проєкту **Tracker Books** у виробничому середовищі (Production).

---

## 1. Апаратне забезпечення (Hardware Requirements)

Для стабільної роботи серверної та клієнтської частин рекомендуються наступні мінімальні характеристики:

* **Архітектура:** x86_64 або ARM64.
* **CPU:** 2 ядра (мінімум 1 core для легких навантажень).
* **RAM:** 2 GB (мінімум 1 GB, якщо використовується Swap).
* **Диск:** 10 GB SSD (враховуючи ОС, залежності та медіафайли).
* **Мережа:** Публічна IP-адреса з відкритими портами 80 (HTTP) та 443 (HTTPS).

---

## 2. Необхідне програмне забезпечення (Software)

На цільовому сервері мають бути встановлені:

* **OS:** Ubuntu 22.04 LTS або аналогічний дистрибутив Linux.
* **Backend Runtime:** Python 3.12.x.
* **Frontend Runtime:** Node.js 20.x + npm.
* **Web Server:** Nginx (як Reverse Proxy).
* **Process Manager:** Gunicorn (для Django) та systemd (для контролю процесів).
* **SSL:** Certbot (Let's Encrypt) для шифрування трафіку.

---

## 3. Налаштування мережі та конфігурація серверів

### Налаштування Nginx
Nginx має приймати запити на порту 80/443 та перенаправляти їх:
1.  Запити на `/api/` та `/admin/` -> до Gunicorn (порт 8000).
2.  Запити на кореневий домен `/` -> до статичних файлів React (`dist/`).

### Змінні оточення (.env)
У виробничому середовищі файл `.env` повинен містити:
* `DEBUG=False` (критично для безпеки).
* `ALLOWED_HOSTS=your-domain.com`.
* `SECRET_KEY` (згенерований заново, довгий випадковий рядок).

### Конфігурація системних сервісів (systemd)
Для того, щоб бекенд працював як фоновий процес і автоматично запускався після перезавантаження сервера, необхідно створити файл конфігурації `/etc/systemd/system/tracker.service`:

```ini
[Unit]
Description=Gunicorn instance to serve Tracker Books
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/Tracker-books/backend
ExecStart=/var/www/Tracker-books/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind 0.0.0.0:8000 \
    backend.wsgi:application

[Install]
WantedBy=multi-user.target

---

## 4. Налаштування СУБД (Database)

Оскільки SQLite зберігає всі дані у файлі `db.sqlite3`, для Production середовища необхідно:

1. **Права доступу:** Користувач, від імені якого працює Gunicorn (наприклад, `www-data`), повинен мати права на **запис** як до самого файлу `db.sqlite3`, так і до **папки**, де він лежить.
   ```bash
   chown www-data:www-data backend/db.sqlite3
   chmod 664 backend/db.sqlite3
   ```

---

## 5. Розгортання коду (Deployment Steps)

1.  **Клонування:** `git clone https://github.com/Yevheniia-Zuieva/Tracker-books.git`.
2.  **Frontend Build:**
    ```bash
    cd frontend
    npm install
    npm run build  # Створює папку dist/
    ```
3.  **Backend Setup:**
    ```bash
    cd ../backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python manage.py collectstatic  # Збір статики для Nginx
    python manage.py migrate        # Застосування міграцій БД
    ```
4.  **Запуск Gunicorn:**
    ```bash
    gunicorn --workers 3 --bind 0.0.0.0:8000 backend.wsgi:application
    ```

---

## 6. Перевірка працездатності (Health Check)

Система вважається успішно розгорнутою, якщо:

1.  **Frontend:** Головна сторінка відкривається без помилок 404/502.
2.  **API Check:** Запит до `http://127.0.0.1:8000/api/books/` повертає коректний JSON (або 401, якщо не авторизовано).
3.  **Swagger:** Сторінка `http://127.0.0.1:8000/api/docs/` доступна та відображає схему API.
4.  **Logs:** Команда `journalctl -u tracker_backend` не показує Traceback-помилок Python.