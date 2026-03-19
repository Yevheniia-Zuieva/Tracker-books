/**
 * @file Сервіси для взаємодії з REST API бекенду.
 * Забезпечують інкапсуляцію HTTP запитів за допомогою axios.
 */
import axios from "axios";

// --- КОНФІГУРАЦІЯ API ---
const API_BASE_URL = "http://localhost:8000/api";
const AUTH_URL = "http://localhost:8000/auth";

/**
 * Налаштований екземпляр Axios для виконання авторизованих запитів.
 * @constant {Object}
 */
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Інтерсептор для додавання JWT-токена
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

// Інтерцептор для обробки помилок (з'єднання з кастомними сторінками)
API.interceptors.response.use(
  (response) => response, // Якщо статус 200-299, просто повертаємо відповідь
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // ОБРОБКА 500 (Помилка сервера)
      if (status === 500) {
        const errorId = error.response.data.error_id || "UNKNOWN";
        // Перенаправляємо на React-маршрут /server-error з параметром ID
        window.location.href = `/server-error?id=${errorId}`;
      }

      // ОБРОБКА 404 (Не знайдено на рівні API)
      if (status === 404) {
        // Якщо це неіснуючий API метод, можемо теж редиректнути на 404
        // window.location.href = "/404"; 
      }
    }
    return Promise.reject(error);
  }
);
// --- СЕРВІСИ ---
/**
 * Сервіс для роботи з аутентифікацією та профілем користувача.
 * @namespace apiAuth
 */
export const apiAuth = {
  /**
   * Виконує вхід користувача та зберігає JWT токени у localStorage.
   * @async
   * @param {string} email - Електронна пошта користувача.
   * @param {string} password - Пароль.
   * @returns {Promise<void>}
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
   * Реєструє нового користувача.
   * @async
   * @param {Object} userData - Дані користувача.
   * @param {string} userData.email - Електронна пошта.
   * @param {string} userData.password - Пароль.
   * @param {string} userData.username - Ім'я користувача.
   * @param {string} userData.re_password - Підтвердження пароля.
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
   * Перевіряє валідність переданого токена, роблячи тестовий запит за профілем.
   * @async
   * @param {string} token - JWT токен доступу.
   * @throws {Error} Якщо токен відсутній або недійсний.
   * @returns {Promise<void>}
   */
  async verifyToken(token) {
    //  імітуємо success
    if (!token) throw new Error("Token missing");
    try {
      await apiAuth.getProfile();
    } catch {
      throw new Error("Token validation failed");
    }
  },

  /**
   * Отримує профіль поточного авторизованого користувача.
   * @async
   * @returns {Promise<Object>} Дані профілю користувача.
   */
  async getProfile() {
    const response = await API.get("/profile/");
    return response.data;
  },

  /**
   * Оновлює інформацію в профілі користувача.
   * @async
   * @param {Object} updates - Об'єкт зі змінами (наприклад, { username: "Нове ім'я" }).
   * @returns {Promise<Object>} Оновлені дані профілю.
   */
  async updateProfile(updates) {
    const response = await API.patch("/profile/", updates);
    return response.data;
  },

  /**
   * Виконує вихід користувача, видаляючи токени з localStorage.
   */
  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  /**
   * Відправляє запит на скидання пароля за вказаним email.
   * @param {string} email - Електронна пошта для скидання.
   * @returns {Promise<Object>} Відповідь сервера.
   */
  resetPasswordRequest: (email) => {
    return axios.post(`${AUTH_URL}/users/reset_password/`, { email });
  },

  /**
   * Встановлює новий пароль після переходу за посиланням з листа.
   * @param {string} uid - Унікальний ідентифікатор користувача.
   * @param {string} token - Токен безпеки з листа.
   * @param {string} new_password - Новий пароль.
   * @param {string} re_new_password - Підтвердження нового пароля.
   * @returns {Promise<Object>} Відповідь сервера.
   */
  resetPasswordConfirm: (uid, token, new_password, re_new_password) => {
    return axios.post(`${AUTH_URL}/users/reset_password_confirm/`, {
      uid,
      token,
      new_password,
      re_new_password,
    });
  },
};

/**
 * Сервіс для керування книгами та статистикою.
 * @namespace apiBooks
 */
export const apiBooks = {
  /**
   * Отримує список усіх книг поточного користувача.
   * @async
   * @returns {Promise<Array>} Масив об'єктів книг.
   */
  async getAllBooks() {
    const response = await API.get("/books/");
    return response.data;
  },

  /**
   * Отримує деталі конкретної книги.
   * @async
   * @param {number|string} bookId - ID книги.
   * @returns {Promise<Object>} Дані книги.
   */
  async getBookDetail(bookId) {
    const response = await API.get(`/books/${bookId}/`);
    return response.data;
  },

  /**
   * Оновлює дані існуючої книги.
   * @async
   * @param {number|string} bookId - ID книги.
   * @param {Object} updates - Об'єкт зі зміненими полями.
   * @returns {Promise<Object>} Оновлена книга.
   */
  async updateBook(bookId, updates) {
    const response = await API.patch(`/books/${bookId}/`, updates);
    return response.data;
  },

  /**
   * Видаляє книгу з бібліотеки.
   * @async
   * @param {number|string} bookId - ID книги.
   * @returns {Promise<void>}
   */
  async deleteBook(bookId) {
    await API.delete(`/books/${bookId}/`);
  },

  /**
   * Додає нову книгу до бібліотеки.
   * @async
   * @param {Object} bookData - Дані нової книги.
   * @returns {Promise<Object>} Створена книга.
   */
  async addBook(bookData) {
    const response = await API.post("/books/", bookData);
    return response.data;
  },

  /**
   * Виконує пошук книг через зовнішній Google Books API.
   * @async
   * @param {string} query - Пошуковий запит.
   * @param {string} filter - Фільтр пошуку (title, author, genre, all).
   * @returns {Promise<Array>} Результати пошуку.
   */
  async searchExternal(query, filter) {
    const response = await API.get("/search/external/", {
      params: { q: query, filter: filter },
    });
    return response.data.results;
  },

  /**
   * Отримує загальну статистику читання користувача.
   * @async
   * @returns {Promise<Object>} Об'єкт зі статистичними даними.
   */
  async getStats() {
    const response = await API.get("/stats/");
    return response.data;
  },

  /**
   * Записує нову сесію читання для книги.
   * @async
   * @param {number|string} bookId - ID книги.
   * @param {number} duration - Тривалість сесії (у хвилинах).
   * @param {string} [note] - Необов'язкова нотатка до сесії.
   * @returns {Promise<Object>} Створена сесія.
   */
  async addSession(bookId, duration, note) {
    const response = await API.post("/sessions/", {
      book: bookId,
      duration: duration,
      note: note || null,
    });
    return response.data;
  },
};

/**
 * Сервіс для роботи з нотатками та цитатами.
 * @namespace apiNotesQuotes
 */
export const apiNotesQuotes = {
  /**
   * Отримує список усіх нотаток користувача.
   * @async
   * @returns {Promise<Array>} Масив нотаток.
   */
  async getAllNotes() {
    const response = await API.get("/notes/");
    return response.data;
  },

  /**
   * Отримує список усіх цитат користувача.
   * @async
   * @returns {Promise<Array>} Масив цитат.
   */
  async getAllQuotes() {
    const response = await API.get("/quotes/");
    return response.data;
  },

  /**
   * Додає нову нотатку.
   * @async
   * @param {number|string} bookId - ID книги.
   * @param {string} content - Вміст нотатки.
   * @returns {Promise<Object>} Створена нотатка.
   */
  async addNote(bookId, content) {
    const response = await API.post("/notes/", { book: bookId, content });
    return response.data;
  },

  /**
   * Створює нову цитату для вказаної книги.
   * @async
   * @param {number|string} bookId - ID книги.
   * @param {string} content - Текст цитати.
   * @returns {Promise<Object>} Створена цитата.
   */
  async addQuote(bookId, content) {
    const response = await API.post("/quotes/", { book: bookId, content });
    return response.data;
  },

  /**
   * Оновлює існуючу нотатку.
   * @async
   * @param {number|string} noteId - ID нотатки.
   * @param {Object} updates - Об'єкт зі змінами.
   * @returns {Promise<Object>} Оновлена нотатка.
   */
  async updateNote(noteId, updates) {
    const response = await API.patch(`/notes/${noteId}/`, updates);
    return response.data;
  },

  /**
   * Оновлює існуючу цитату.
   * @async
   * @param {number|string} quoteId - ID цитати.
   * @param {Object} updates - Об'єкт зі змінами.
   * @returns {Promise<Object>} Оновлена цитата.
   */
  async updateQuote(quoteId, updates) {
    const response = await API.patch(`/quotes/${quoteId}/`, updates);
    return response.data;
  },

  /**
   * Видаляє нотатку.
   * @async
   * @param {number|string} noteId - ID нотатки.
   * @returns {Promise<void>}
   */
  async deleteNote(noteId) {
    await API.delete(`/notes/${noteId}/`);
  },

  /**
   * Видаляє цитату.
   * @async
   * @param {number|string} quoteId - ID цитати.
   * @returns {Promise<void>}
   */
  async deleteQuote(quoteId) {
    await API.delete(`/quotes/${quoteId}/`);
  },
};
