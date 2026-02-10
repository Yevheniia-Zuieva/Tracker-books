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
  Navigate,
} from "react-router-dom";
import { RequestResetPage } from "./components/RequestResetPage";
import { ResetPasswordConfirmPage } from "./components/ResetPasswordConfirmPage";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("home");

  // 1. Перевірка авторизації при першому завантаженні
  useEffect(() => {
    checkAuth();
  }, []);

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

  // 2. Обробка успішного входу/реєстрації (викликається з AuthPage)
  const handleAuthSuccess = (userData, token) => {
    localStorage.setItem("access_token", token);
    // AuthPage повертає об'єкт {id, email, name}, приводимо його до UserProfile
    setUser(userData);
  };

  // 3. Вихід з системи
  const handleLogout = () => {
    apiAuth.logout(); // Видаляє токени
    setUser(null);
  };

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

  // Основний інтеріейс
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

        {/* Марштур авторизації/головної сторінки */}
        {/* Якщо юзер Є -> показуємо додаток. Якщо НЕМАЄ -> показуємо логін */}
        <Route
          path="*"
          element={
            user ? <MainAppLayout /> : <AuthPage onAuth={handleAuthSuccess} />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
