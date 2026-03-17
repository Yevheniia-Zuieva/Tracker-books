# Update & Rollback Guide (Регламент оновлення та відкату)

Цей документ містить покрокові інструкції для **Release Engineer** та **DevOps** фахівців щодо проведення планових оновлень системи **Tracker Books** та дій у разі виникнення критичних помилок.

---

## 1. Підготовка до оновлення (Preparation)

### *Створення резервних копій (Backup)*

Перед початком оновлення обов'язково створіть резервні копії поточного стану системи:

* **База даних (SQLite):**
```bash
cp backend/db.sqlite3 backend/db.sqlite3.bak_$(date +%Y%m%d_%H%M)
```

* **Медіа-файли (Обкладинки книг):**
```bash
tar -czf media_backup_$(date +%Y%m%d).tar.gz backend/media/
```

### *Перевірка сумісності*

* Перевірте файл `backend/requirements.txt` на наявність нових залежностей
* Переконайтеся, що версії **Python (3.12+)** та **Node.js (20+)** відповідають вимогам

### *Планування часу простою (Downtime)*

* Очікуваний час простою: **5–15 хвилин**
* Вікно оновлення: **02:00 – 05:00**

---

## 2. Процес оновлення (Update Process)

### *Крок 1: Зупинка потрібних служб*
```bash
sudo systemctl stop tracker.service
```

### *Крок 2: Розгортання нового коду*
```bash
git fetch origin
git checkout main
git pull origin main
```

### *Крок 3: Міграція даних та оновлення Backend*
```bash
source venv/bin/activate
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py collectstatic
```

### *Крок 4: Оновлення конфігурацій та запуск*

Оновіть файл `.env` (якщо додалися нові ключі) та запустіть служби:

```bash
sudo systemctl start tracker.service
sudo systemctl restart nginx
```

---

## 3. Перевірка після оновлення (Verification)

Після запуску служб необхідно виконати наступні перевірки:

### *Тести правильності роботи*

1. **Health Check API:**
Переконатися, що запит до `http://127.0.0.1:8000/api/books/`
 повертає статус `200 OK`

2. **Frontend Load:**
Перевірити завантаження головної сторінки та коректність відображення нових функцій

3. **Database Connectivity:**
Спробувати створити новий запис (книгу), щоб підтвердити успішну міграцію БД та наявність прав на запис у SQLite

### *Моніторинг продуктивності*

* Перевірити використання RAM та CPU процесом Gunicorn через `top` або `htop`
* Переконатися, що час відповіді сервера (Latency) не зріс після оновлення

### *Можливі проблеми та їх вирішення*

* **Помилка 502 Bad Gateway:**
Перевірте, чи запущено сервіс `tracker.service` та чи не впав Gunicorn

* **Помилка 500 Internal Server Error:**
Перевірте логи Django (`python manage.py tail`)

* **Статичні файли (CSS/JS) не оновилися:**
Очистіть кеш браузера або перевірте виконання `collectstatic`

---

## 4. Процедура відкату (Rollback Procedure) ⚠️

У разі невдалого оновлення виконується негайний відкат до стабільного стану:

### *Відкат коду*
```bash
git checkout HEAD@{1}
```

### *Відновлення бази даних*
```bash
mv backend/db.sqlite3 backend/db.sqlite3.failed
cp backend/db.sqlite3.bak_YYYYMMDD_HHMM backend/db.sqlite3
```

### *Перезапуск служб*
```bash
sudo systemctl restart tracker.service
sudo systemctl restart nginx
```