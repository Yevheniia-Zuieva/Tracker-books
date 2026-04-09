/**
 * @file Головний компонент додатку.
 * Відповідає за ініціалізацію, маршрутизацію (React Router), глобальний стан авторизації 
 * та відображення основного макета (Layout) з навігацією.
 */
import { useState, useEffect, lazy, Suspense } from "react";
import { apiAuth } from "./api/ApiService";
import { Loader2 } from "lucide-react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

const AuthPage = lazy(() => import('./components/AuthPage'));
const HomePage = lazy(() => import('./components/HomePage'));
const SearchPage = lazy(() => import('./components/SearchPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const HelpPage = lazy(() => import('./components/HelpPage'));
const RequestResetPage = lazy(() => import('./components/RequestResetPage')); 
const ResetPasswordConfirmPage = lazy(() => import('./components/ResetPasswordConfirmPage')); 
const NotFound = lazy(() => import('./components/NotFound')); 
const ServerError = lazy(() => import('./components/ServerError'));

/**
 * Головний React-компонент додатку Tracker Books.
 * Керує станом користувача, перевіряє JWT токен при завантаженні та визначає,
 * які сторінки показувати (авторизацію чи основний інтерфейс).
 *
 * @returns {JSX.Element} Кореневий компонент додатку з налаштованою маршрутизацією.
 */
function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("home");

  // Перевірка авторизації при першому завантаженні
  useEffect(() => {
    checkAuth();
  }, []);

  /**
 * Глобальний перехоплювач помилок JavaScript (Frontend Logging).
 * Використовується для моніторингу стабільності клієнтської частини.
 * * @param {string} message - Опис помилки (наприклад, "ReferenceError: x is not defined").
 * @param {string} source - Шлях до файлу скрипта, де виникла помилка.
 * @param {number} lineno - Рядок коду, на якому стався збій.
 * @param {number} colno - Стовпець рядка (позиція символу).
 * @param {Error} error - Повний об'єкт помилки, що містить Stack Trace для відладки.
 */
  window.onerror = function(message, source, lineno, colno, error) {
    fetch('http://localhost:8000/api/logs/frontend/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        source: source,
        line: lineno,
        column: colno,
        stack: error ? error.stack : 'No stack trace available',
        user: localStorage.getItem('user_email') || 'anonymous'
      })
    });
  };

  /**
   * Асинхронно перевіряє наявність та валідність токена доступу.
   * Якщо токен дійсний, завантажує профіль користувача.
   * @async
   */
  const checkAuth = async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        // Якщо є токен, намагаємось отримати профіль користувача
        const profile = await apiAuth.getProfile();
        setUser(profile);
      } catch (error) {
        console.error("Сесія недійснa:", error);
        localStorage.removeItem("access_token");
      }
    }
    setIsLoading(false);
  };

  /**
   * Обробник успішної авторизації. Зберігає токен та встановлює користувача.
   * @param {Object} userData - Дані профілю авторизованого користувача.
   * @param {string} token - JWT токен доступу.
   */
  const handleAuthSuccess = (userData, token) => {
    localStorage.setItem("access_token", token);
    // AuthPage повертає об'єкт {id, email, name}, приводимо його до UserProfile
    setUser(userData);
  };

  /**
   * Обробник виходу з системи. Видаляє токени та очищає стан користувача.
   */
  const handleLogout = () => {
    apiAuth.logout(); // Видаляє токени
    setUser(null);
  };

  /**
   * Обробник кліку на книгу для перегляду її деталей.
   * @param {Object} book - Об'єкт обраної книги.
   */
  const handleBookClick = (book) => {
    console.log("Клік по книзі:", book.title);
    // Тут пізніше буде відкриття модального вікна або перехід на сторінку книги
  };

  // Показуємо лоадер, поки перевіряємо токен
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /**
   * Внутрішній компонент основного макета (Layout).
   * Містить навігаційну панель (Header) та область для рендерингу поточного вигляду.
   * @returns {JSX.Element} Макет авторизованої зони додатку.
   */
  const MainAppLayout = () => (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header 
        user={user} 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onLogout={handleLogout} 
      />

      {/* Головний контент */}
      <main className="flex-1">
        {currentView === "home" ? (
          <HomePage onBookClick={handleBookClick} />
        ) : currentView === "search" ? (
          <SearchPage />
        ) : currentView === "about" ? (
          <AboutPage /> 
        ) : currentView === "help" ? (
          <HelpPage /> 
        ) : (
          <HomePage onBookClick={handleBookClick} /> 
        )}
      </main>

      <Footer onViewChange={setCurrentView}/>
    </div>
  );

  return (
    <Router>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Завантаження модуля...</p>
        </div>
      }>
        <Routes>
          {/* Публічні маршрути, які доступні без авторизації) */}
          <Route path="/forgot-password" element={<RequestResetPage />} />
          <Route
            path="/password-reset/:uid/:token"
            element={<ResetPasswordConfirmPage />}
          />

          {/* Сторінка 500 доступна завжди, щоб показати помилку сервера */}
          <Route path="/server-error" element={<ServerError />} />

          {/* Марштур авторизації/головної сторінки */}
          {/* Якщо юзер Є -> показуємо додаток. Якщо НЕМАЄ -> показуємо логін */}
          <Route
            path="/"
            element={
              user ? <MainAppLayout /> : <AuthPage onAuth={handleAuthSuccess} />
            }
          />

          {/* Якщо ввели адресу, якої не існує ні в API, ні в роутері */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
