/**
 * @file Повний сервіс для взаємодії з API.
 * Порядок функцій змінено для уникнення помилок ініціалізації.
 */
import axios from "axios";

// --- 1. КОНФІГУРАЦІЯ ---
const API_BASE_URL = "http://localhost:8000/api";
const AUTH_URL = "http://localhost:8000/auth";

/**
 * Екземпляр Axios для запитів до бази даних книг.
 */
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- 2. СЕРВІС АВТОРИЗАЦІЇ (Має бути визначений ДО інтерцепторів) ---
export const apiAuth = {
  async login(email, password) {
    const response = await axios.post(`${AUTH_URL}/jwt/create/`, { email, password });
    const { access, refresh } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  },

  async register({ email, password, username, re_password }) {
    await axios.post(`${AUTH_URL}/users/`, { email, password, username, re_password });
  },

  async getProfile() {
    const response = await API.get("/profile/");
    return response.data;
  },

  async updateProfile(updates) {
    const response = await API.patch("/profile/", updates);
    return response.data;
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  resetPasswordRequest: (email) => axios.post(`${AUTH_URL}/users/reset_password/`, { email }),

  resetPasswordConfirm: (uid, token, new_password, re_new_password) => 
    axios.post(`${AUTH_URL}/users/reset_password_confirm/`, { uid, token, new_password, re_new_password }),
};

// --- 3. ІНТЕРЦЕПТОРИ (ЛОГІКА ТOKEN REFRESH) ---

// Додавання токена до кожного запиту
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехоплення помилок (401 Refresh та 500)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const status = error.response.status;

      // ЛОГІКА 401: Спроба оновити токен, якщо він протух
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          apiAuth.logout();
          window.location.replace("/auth"); // Використовуємо replace для безпеки
          return Promise.reject(error);
        }

        try {
          // Використовуємо чистий axios, щоб не зациклити інтерцептори
          const response = await axios.post(`${AUTH_URL}/jwt/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem("access_token", access);
          
          // Оновлюємо заголовок і повторюємо запит
          originalRequest.headers["Authorization"] = `Bearer ${access}`;
          return API(originalRequest);
        } catch (refreshError) {
          console.warn("Refresh token expired. Logging out...");
          apiAuth.logout();
          window.location.replace("/auth");
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
  }
);

// --- 4. СЕРВІС КНИГ ---
export const apiBooks = {
  async getAllBooks() {
    const response = await API.get("/books/");
    return response.data;
  },
  async getBookDetail(bookId) {
    const response = await API.get(`/books/${bookId}/`);
    return response.data;
  },
  async updateBook(bookId, updates) {
    const response = await API.patch(`/books/${bookId}/`, updates);
    return response.data;
  },
  async deleteBook(bookId) {
    await API.delete(`/books/${bookId}/`);
  },
  async addBook(bookData) {
    const response = await API.post("/books/", bookData);
    return response.data;
  },
  async searchExternal(query, filter, startIndex = 0) {
    const response = await API.get("/search/external/", {
      params: { q: query, filter: filter, startIndex: startIndex },
    });
    return response.data.results;
  },
  async getStats() {
    const response = await API.get("/stats/");
    return response.data;
  },
  async addSession(bookId, data) {
    const response = await API.post("/sessions/", {
      book: bookId,
      ...data 
    });
    return response.data;
  },
};

// --- 5. НОТАТКИ ТА ЦИТАТИ ---
export const apiNotesQuotes = {
  async getAllNotes() {
    const response = await API.get("/notes/");
    return response.data;
  },
  async getAllQuotes() {
    const response = await API.get("/quotes/");
    return response.data;
  },
  async addNote(bookId, content) {
    const response = await API.post("/notes/", { book: bookId, content });
    return response.data;
  },
  async addQuote(bookId, content) {
    const response = await API.post("/quotes/", { book: bookId, content });
    return response.data;
  },
  async updateNote(noteId, updates) {
    const response = await API.patch(`/notes/${noteId}/`, updates);
    return response.data;
  },
  async updateQuote(quoteId, updates) {
    const response = await API.patch(`/quotes/${quoteId}/`, updates);
    return response.data;
  },
  async deleteNote(noteId) {
    await API.delete(`/notes/${noteId}/`);
  },
  async deleteQuote(quoteId) {
    await API.delete(`/quotes/${quoteId}/`);
  },
};

// --- 6. ЗВОРОТНИЙ ЗВ'ЯЗОК ---
export const apiFeedback = {
  async sendFeedback(message) {
    const response = await API.post("/feedback/", { message });
    return response.data;
  }
};