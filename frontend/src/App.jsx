/**
 * @file Головний компонент додатку.
 * Відповідає за ініціалізацію, маршрутизацію (React Router), глобальний стан авторизації 
 * та відображення основного макета (Layout) з навігацією.
 */
import { useState, useEffect } from "react";
import { AuthPage } from "./components/AuthPage";
import { HomePage } from "./components/HomePage";
import { apiAuth } from "./api/ApiService";
import { Loader2, LogOut, User as UserIcon, Search } from "lucide-react";
import { Button } from "./components/ui/button";
import { SearchPage } from "./components/SearchPage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { RequestResetPage } from "./components/RequestResetPage";
import { ResetPasswordConfirmPage } from "./components/ResetPasswordConfirmPage";
import NotFound from './components/NotFound';
import ServerError from './components/ServerError';

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
      {/* Хедер */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          {/* Логотип (клікабельний -> веде на Home) */}
          <div
            className="flex items-center gap-2 font-bold text-xl cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setCurrentView("home")}
          >
            <span>Tracker Books</span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Кнопка Пошук книг */}
            <Button
              variant={currentView === "search" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("search")}
              className="hidden md:flex"
            >
              <Search className="h-4 w-4 mr-2" />
              Пошук книг
            </Button>
            {/* Мобільна версія кнопки пошуку */}
            <Button
              variant={currentView === "search" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setCurrentView("search")}
              className="md:hidden"
            >
              <Search className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <UserIcon className="h-4 w-4" />
              </div>
              <span className="hidden md:inline">
                {user.name || user.email}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Вийти"
            >
              <LogOut className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </header>

      {/* Головний контент */}
      <main className="flex-1">
        {currentView === "home" ? (
          <HomePage onBookClick={handleBookClick} />
        ) : (
          <SearchPage />
        )}
      </main>
    </div>
  );

  return (
    <Router>
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
    </Router>
  );
}

export default App;
