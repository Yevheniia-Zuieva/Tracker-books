import axios from "axios";

// --- КОНФІГУРАЦІЯ API ---
const API_URL = "http://localhost:8000";
const API_BASE_URL = "http://localhost:8000/api";
const AUTH_URL = "http://localhost:8000/auth";

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

// --- СЕРВІСИ ---

export const apiAuth = {
  async login(email, password) {
    const response = await axios.post(`${AUTH_URL}/jwt/create/`, {
      email,
      password,
    });
    const { access, refresh } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  },

  async register({ email, password, username, re_password }) {
    await axios.post(`${AUTH_URL}/users/`, {
      email,
      password,
      username,
      re_password,
    });
  },

  async verifyToken(token) {
    //  імітуємо success
    if (!token) throw new Error("Token missing");
    try {
      await apiAuth.getProfile();
    } catch (error) {
      throw new Error("Token validation failed");
    }
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

  // 1. Відправити email для скидання
  resetPasswordRequest: (email) => {
    return axios.post(`${AUTH_URL}/users/reset_password/`, { email });
  },

  // Встановити новий пароль
  resetPasswordConfirm: (uid, token, new_password, re_new_password) => {
    return axios.post(`${AUTH_URL}/users/reset_password_confirm/`, {
      uid,
      token,
      new_password,
      re_new_password,
    });
  },
};

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

  async searchExternal(query, filter) {
    const response = await API.get("/search/external/", {
      params: { q: query, filter: filter },
    });
    return response.data.results;
  },

  async getStats() {
    const response = await API.get("/stats/");
    return response.data;
  },

  async addSession(bookId, duration, note) {
    const response = await API.post("/sessions/", {
      book: bookId,
      duration: duration,
      note: note || null,
    });
    return response.data;
  },
};

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
