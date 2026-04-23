/**
 * @file Сервіс взаємодії з бекенд-частиною застосунку "Tracker Books".
 * @description Модуль містить методи для роботи з автентифікацією, бібліотекою книг,
 * статистикою та нотатками. Реалізує автоматичне оновлення JWT-токенів
 * та глобальну обробку помилок сервера.
 */
import axios from "axios";

// --- КОНФІГУРАЦІЯ ---
/** @constant {string} Базова адреса для запитів до бізнес-логіки трекера */
const API_BASE_URL = "http://localhost:8000/api";

/** @constant {string} Адреса сервісу автентифікації Djoser */
const AUTH_URL = "http://localhost:8000/auth";

/**
 * Екземпляр Axios для роботи з основними даними (книги, сесії, нотатки).
 * Налаштований на роботу з форматом JSON за замовчуванням.
 * @type {Object}
 */
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- СЕРВІС АВТОРИЗАЦІЇ ---
/**
 * Об'єкт методів для керування обліковими даними користувача.
 */
export const apiAuth = {
  /**
   * Авторизація користувача та отримання токенів доступу.
   * @async
   * @param {string} email - Електронна пошта користувача.
   * @param {string} password - Пароль.
   * @returns {Promise<void>} Зберігає access та refresh токени у localStorage.
   */
  async login(email, password) {
    const response = await axios.post(`${AUTH_URL}/jwt/create/`, {
      email,
      password,
    });
    const { access, refresh } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  },

  /**
   * Реєстрація нового облікового запису.
   * @async
   * @param {Object} data - Дані реєстрації.
   * @param {string} data.email - Email.
   * @param {string} data.password - Пароль.
   * @param {string} data.username - Ім'я користувача.
   * @param {string} data.re_password - Підтвердження пароля.
   * @returns {Promise<void>}
   */
  async register({ email, password, username, re_password }) {
    await axios.post(`${AUTH_URL}/users/`, {
      email,
      password,
      username,
      re_password,
    });
  },

  /**
   * Отримання даних профілю поточного користувача.
   * @async
   * @returns {Promise<Object>} Об'єкт профілю користувача.
   */
  async getProfile() {
    const response = await API.get("/profile/");
    return response.data;
  },

  /**
   * Оновлення даних профілю (ім'я, біографія, цілі).
   * @async
   * @param {Object} updates - Часткові оновлення даних профілю.
   * @returns {Promise<Object>} Оновлений об'єкт профілю.
   */
  async updateProfile(updates) {
    const response = await API.patch("/profile/", updates);
    return response.data;
  },

  /**
   * Вихід із системи. Видаляє токени та завершує сесію.
   */
  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  /**
   * Запит на відновлення пароля через email.
   * @param {string} email - Email користувача.
   */
  resetPasswordRequest: (email) =>
    axios.post(`${AUTH_URL}/users/reset_password/`, { email }),

  /**
   * Підтвердження зміни пароля за посиланням із листа.
   */
  resetPasswordConfirm: (uid, token, new_password, re_new_password) =>
    axios.post(`${AUTH_URL}/users/reset_password_confirm/`, {
      uid,
      token,
      new_password,
      re_new_password,
    }),
};

// --- ІНТЕРЦЕПТОРИ ---

/**
 * Перехоплювач запитів: автоматично додає заголовок Authorization
 * до кожного запиту, якщо в системі є збережений токен доступу.
 */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Перехоплювач відповідей: обробляє випадки простроченого токена (401)
 * та критичних помилок сервера (500).
 * Реалізує логіку автоматичного оновлення сесії без переривання роботи[cite: 22].
 */
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const status = error.response.status;

      // ЛОГІКА 401: Спроба оновити токен
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          apiAuth.logout();
          window.location.replace("/login"); // Використовуємо replace для безпеки
          return Promise.reject(error);
        }

        try {
          // Запит на оновлення access токена
          const response = await axios.post(`${AUTH_URL}/jwt/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem("access_token", access);

          // Оновлення заголовку і повторення запиту
          originalRequest.headers["Authorization"] = `Bearer ${access}`;
          return API(originalRequest);
        } catch (refreshError) {
          console.warn("Refresh token expired. Logging out...");
          apiAuth.logout();
          window.location.replace("/login");
          return Promise.reject(refreshError);
        }
      }

      // ОБРОБКА 500: Помилка сервера
      if (status === 500) {
        const errorId = error.response.data?.error_id || "UNKNOWN";
        window.location.href = `/server-error?id=${String(errorId)}`;
      }
    }

    return Promise.reject(error);
  },
);

// --- СЕРВІС КНИГ ---
/**
 * Об'єкт методів для роботи з бібліотекою та статистикою.
 */
export const apiBooks = {
  /**
   * Отримання списку книг із підтримкою пагінації та фільтрації.
   * Використовується для відображення книг за статусами.
   * @async
   * @param {string|null} url - Повна адреса (для пагінації).
   * @param {Object} params - Параметри фільтрації (status, sort).
   * @returns {Promise<Object>} Результати пошуку та мета-дані пагінації.
   */
  async getAllBooks(url = null, params = {}) {
    const endpoint = url || "/books/";
    const response = await API.get(endpoint, { params: url ? {} : params });
    return response.data;
  },

  /**
   * Отримання детальної інформації про конкретну книгу за її ID.
   * Необхідно для перегляду прогресу та дат читання.
   * @async
   * @param {number} bookId - Унікальний ідентифікатор книги.
   * @returns {Promise<Object>} Дані книги.
   */
  async getBookDetail(bookId) {
    const response = await API.get(`/books/${bookId}/`);
    return response.data;
  },

  /**
   * Оновлення даних книги (прогрес, статус, оцінка).
   * @async
   * @param {number} bookId - ID книги.
   * @param {Object} updates - Об'єкт із полями для оновлення.
   * @returns {Promise<Object>} Оновлені дані книги.
   */
  async updateBook(bookId, updates) {
    const response = await API.patch(`/books/${bookId}/`, updates);
    return response.data;
  },

  /**
   * Видалення книги з бібліотеки користувача.
   * @async
   * @param {number} bookId - ID книги для видалення.
   * @returns {Promise<void>}
   */
  async deleteBook(bookId) {
    await API.delete(`/books/${bookId}/`);
  },

  /**
   * Додавання нової книги до бібліотеки вручну.
   * @async
   * @param {Object} bookData - Дані нової книги (назва, автор, сторінки тощо).
   * @returns {Promise<Object>} Створений об'єкт книги.
   */
  async addBook(bookData) {
    const response = await API.post("/books/", bookData);
    return response.data;
  },

  /**
   * Пошук у зовнішніх базах (Google Books API) через проксі-сервер.
   * @async
   * @param {string} query - Пошуковий запит.
   * @param {string} filter - Критерій (title, author тощо).
   * @param {number} [startIndex=0] - Зміщення для пагінації.
   * @returns {Promise<Object>} Список знайдених книг.
   */
  async searchExternal(query, filter, startIndex = 0) {
    const response = await API.get("/search/external/", {
      params: { q: query, filter: filter, startIndex: startIndex },
    });
    return response.data;
  },

  /**
   * Отримання агрегованої статистики читання для візуалізації графіків.
   * @async
   * @returns {Promise<Object>} Дані для чартів (жанри, активність по місяцях).
   */
  async getStats() {
    const response = await API.get("/stats/");
    return response.data;
  },

  /**
   * Фіксація сесії читання для книги.
   * @async
   * @param {number} bookId - ID книги.
   * @param {Object} data - Дані сесії (тривалість, нотатка).
   * @return {Promise<Object>} Створений об'єкт сесії.
   */
  async addSession(bookId, data) {
    const response = await API.post("/sessions/", {
      book: bookId,
      ...data,
    });
    return response.data;
  },

/**
   * Метод для архівації старого циклу та початку нового читання.
   * Викликає @action start_re_reading у Django.
   */
  async startReReading(id) {
    const response = await API.post(`/books/${id}/start_re_reading/`);
    return response.data;
  },
};

// --- НОТАТКИ ТА ЦИТАТИ ---
/**
 * @namespace apiNotesQuotes
 * @description Сервіс для управління користувацькими нотатками та збереженими цитатами.
 */
export const apiNotesQuotes = {
  /**
   * Отримання всіх нотаток з підтримкою пагінації.
   * @param {string|null} url - Повний URL наступної сторінки або null для першої.
   */
  getAllNotes: async (url = null) => {
    // Якщо url передано (це повний шлях від Django), використовуємо його.
    // Якщо ні — використовуємо стандартний відносний шлях.
    const endpoint = url || "/notes/";
    
    const response = await API.get(endpoint); 
    return response.data;
  },

  /**
   * Отримання всіх збережених цитат.
   * @async
   * @returns {Promise<Array>} Масив об'єктів цитат.
   */
  async getAllQuotes(url = null, params = {}) {
    const endpoint = url || "/quotes/";
    const response = await API.get(endpoint, { 
        params: url ? {} : params 
      }); 
    return response.data;
  },

  /**
   * Додавання нової текстової нотатки до книги.
   * @async
   * @param {number} bookId - ID пов'язаної книги.
   * @param {string} content - Текст нотатки.
   * @returns {Promise<Object>}
   */
  async addNote(bookId, content) {
    const response = await API.post("/notes/", { book: bookId, content });
    return response.data;
  },

  /**
   * Збереження цитати з книги.
   * @async
   * @param {number} bookId - ID пов'язаної книги.
   * @param {string} content - Текст цитати.
   * @returns {Promise<Object>}
   */
  async addQuote(bookId, content) {
    const response = await API.post("/quotes/", { book: bookId, content });
    return response.data;
  },

  /**
   * Редагування змісту існуючої нотатки.
   * @async
   * @param {number} noteId - ID нотатки.
   * @param {Object} updates - Об'єкт із оновленим контентом або статусом "улюблене".
   * @returns {Promise<Object>}
   */
  async updateNote(noteId, updates) {
    const response = await API.patch(`/notes/${noteId}/`, updates);
    return response.data;
  },

  /**
   * Редагування існуючої цитати.
   * @async
   * @param {number} quoteId - ID цитати.
   * @param {Object} updates - Об'єкт оновлення.
   * @returns {Promise<Object>}
   */
  async updateQuote(quoteId, updates) {
    const response = await API.patch(`/quotes/${quoteId}/`, updates);
    return response.data;
  },

  /**
   * Видалення нотатки.
   * @async
   * @param {number} noteId - ID нотатки.
   */
  async deleteNote(noteId) {
    await API.delete(`/notes/${noteId}/`);
  },

  /**
   * Видалення цитати.
   * @async
   * @param {number} quoteId - ID цитати.
   */
  async deleteQuote(quoteId) {
    await API.delete(`/quotes/${quoteId}/`);
  },
};

// --- ЗВОРОТНИЙ ЗВ'ЯЗОК ---
/**
 * @namespace apiFeedback
 * @description Сервіс для відправки відгуків та пропозицій адміністрації.
 */
export const apiFeedback = {
  /**
   * Надіслати повідомлення зворотного зв'язку.
   * @async
   * @param {string} message - Текст відгуку.
   * @returns {Promise<Object>} Статус успішної відправки.
   */
  async sendFeedback(message) {
    const response = await API.post("/feedback/", { message });
    return response.data;
  },
};
