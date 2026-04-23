/**
 * @file Головний вхідний компонент застосунку "Tracker Books".
 * @description Відповідає за конфігурацію глобального стану автентифікації,
 * декларативну маршрутизацію (React Router v6), управління темами оформлення
 * та оптимізацію продуктивності через розділення коду (Code Splitting).
 */

import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { apiAuth } from "./api/ApiService";
import { Loader2 } from "lucide-react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

// Ледаче завантаження сторінок для оптимізації швидкості
// Використовується для завантаження компонентів сторінок лише тоді, коли вони необхідні,
// що значно скорочує розмір початкового бандла та час першого рендерингу.
const AuthPage = lazy(() => import("./components/AuthPage"));
const HomePage = lazy(() => import("./components/HomePage"));
const SearchPage = lazy(() => import("./components/SearchPage"));
const AboutPage = lazy(() => import("./components/AboutPage"));
const HelpPage = lazy(() => import("./components/HelpPage"));
const RequestResetPage = lazy(() => import("./components/RequestResetPage"));
const ResetPasswordConfirmPage = lazy(
  () => import("./components/ResetPasswordConfirmPage"),
);
const NotFound = lazy(() => import("./components/NotFound"));
const ServerError = lazy(() => import("./components/ServerError"));
const BookDetails = lazy(() => import("./components/BookDetails"));
const AllNotesPage = lazy(() => import("./components/AllNotesPage"));
const AllQuotesPage = lazy(() => import("./components/AllQuotesPage"));

/**
 * Основний макет (Layout) застосунку для авторизованих користувачів.
 * * Забезпечує єдину структуру інтерфейсу: Header -> Main Content -> Footer.
 * * Реалізує автоматичне управління темною темою на основі налаштувань користувача.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {Object|null} props.user - Об'єкт профілю поточного користувача.
 * @param {Function} props.handleLogout - Функція для завершення сеансу[cite: 19].
 * @returns {React.JSX.Element} Структурний макет із вкладеними маршрутами.
 */
const MainAppLayout = ({ user, handleLogout }) => {
  /**
   * Ефект ініціалізації теми оформлення.
   * Перевіряє `localStorage` або системні налаштування ОС користувача.
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header user={user} onLogout={handleLogout} />

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          }
        >
          {/* Outlet рендерить дочірні маршрути, визначені в App.jsx */}
          <Outlet />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
};

/**
 * Кореневий компонент застосунку.
 * * Реалізує логіку автентифікації та захисту маршрутів.
 * * Виконує перевірку активної сесії при кожному завантаженні застосунку.
 * * @component
 * @returns {React.JSX.Element} Конфігурація маршрутизатора застосунку.
 */
function App() {
  /**
 * Стан авторизованого користувача
 * @type {Object|null}
 */
  const [user, setUser] = useState(null);

  /**
 * Стан ініціалізації застосунку (перевірка сесії)
 * @type {boolean}
 */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Перевірка дійсності сесії користувача.
   * Отримує профіль користувача, якщо в `localStorage` знайдено токен доступу.
   * @async
   * @callback
   */
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const profile = await apiAuth.getProfile();
        setUser(profile);
      } catch (error) {
        console.error("Сесія недійснa:", error);
        localStorage.removeItem("access_token");
      }
    }
    setIsLoading(false);
  }, []);

  /** Виклик перевірки автентифікації при мотуванні компонента */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Обробник успішного входу або реєстрації.
   * @param {Object} userData - Отримані дані профілю.
   * @param {string} token - JWT токен доступу.
   */
  const handleAuthSuccess = (userData, token) => {
    localStorage.setItem("access_token", token);
    setUser(userData);
  };

  /** Обробник виходу з облікового запису*/
  const handleLogout = () => {
    apiAuth.logout();
    setUser(null);
  };

  /** Рендеринг глобального індикатора завантаження під час перевірки сесії */
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Router>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        }
      >
        <Routes>
          {/* Публічні маршрути (доступні без логіну) */}
          <Route path="/forgot-password" element={<RequestResetPage />} />
          <Route
            path="/password-reset/:uid/:token"
            element={<ResetPasswordConfirmPage />}
          />
          <Route path="/server-error" element={<ServerError />} />

          {/* Автоматичний редірект авторизованих користувачів з логіну на головну сторінку */}
          <Route
            path="/login"
            element={
              !user ? (
                <AuthPage onAuth={handleAuthSuccess} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* ЗАХИЩЕНІ МАРШРУТИ (Тільки для авторизованих користувачів) */}
          <Route
            element={
              user ? (
                <MainAppLayout user={user} handleLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/books/:id" element={<BookDetails />} />
            <Route path="/notes" element={<AllNotesPage />} />
            <Route path="/quotes" element={<AllQuotesPage />} />

            {/* Сторінка-заглушки для майбутнього функціоналу */}
            <Route
              path="/profile"
              element={
                <div className="p-20 text-center">
                  Налаштування акаунту (у розробці)
                </div>
              }
            />
          </Route>

          {/* 404 - Сторінка не знайдена */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
