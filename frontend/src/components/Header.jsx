/**
 * @file Головний навігаційний компонент застосунку (Header).
 * @description Забезпечує доступ до основних розділів сайту, керування темою оформлення,
 * пошук книг та випадаюче меню профілю користувача.
 */
import { useState, useRef, useEffect } from "react";
import {
  Search,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  FileText,
  Quote as QuoteIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate, useLocation, Link } from "react-router-dom";

/**
 * Компонент Header.
 * * Функціональні можливості:
 * - Перемикання між темною та світлою темами з синхронізацією в localStorage.
 * - Відображення імені та пошти поточного користувача.
 * - Навігація за допомогою React Router.
 * - Розумне закриття меню при кліку поза його межами.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {Object|null} props.user - Об'єкт профілю користувача (username, email).
 * @param {Function} props.onLogout - Функція для завершення сесії користувача.
 * @returns {React.JSX.Element} Рендерить верхню панель застосунку.
 */
export function Header({ user, onLogout }) {
  /** @type {[boolean, Function]} Стан видимості випадаючого меню профілю */
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  /** @type {[boolean, Function]} Стан поточної теми (true для темної) */
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  /** @type {React.RefObject<HTMLDivElement>} Референс для відстеження кліків поза меню */
  const dropdownRef = useRef(null);

  // Хуки маршрутизації
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Ефект для закриття меню профілю.
   * Реєструє глобальний слухач подій mousedown для виявлення кліків поза контейнером меню.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Перемикає колірну схему застосунку.
   * Модифікує клас `dark` кореневого елемента `html` та оновлює `localStorage`.
   */
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  /**
   * Обробник переходу по пунктах меню.
   * Змінює маршрут та автоматично закриває меню.
   * @param {string} path - URL-шлях для переходу.
   */
  const handleMenuClick = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Логотип */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity"
        >
          <span>Tracker Books</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Пошук */}
          <Button
            variant={location.pathname === "/search" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate("/search")}
            className="hidden md:flex gap-2"
          >
            <Search className="h-4 w-4" />
            Пошук книг
          </Button>

          <Button
            variant={location.pathname === "/search" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => navigate("/search")}
            className="md:hidden"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* КОРИСТУВАЧ ТА ВИПАДНИЙ СПИСОК */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UserIcon className="h-4 w-4" />
              </div>
              <span className="hidden md:inline text-sm font-medium pr-1">
                {user?.username || "Користувач"}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* МЕНЮ */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b mb-1 text-left">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Мій кабінет
                  </p>
                  <p className="text-sm font-bold truncate">{user?.email}</p>
                </div>

                <div className="space-y-1">
                  <DropdownItem
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Мій акаунт"
                    onClick={() => handleMenuClick("/profile")}
                  />
                  <DropdownItem
                    icon={<FileText className="h-4 w-4" />}
                    label="Усі нотатки"
                    onClick={() => handleMenuClick("/notes")}
                  />
                  <DropdownItem
                    icon={<QuoteIcon className="h-4 w-4" />}
                    label="Усі цитати"
                    onClick={() => handleMenuClick("/quotes")}
                  />
                </div>

                <div className="my-1 border-t" />

                <div className="space-y-1">
                  <button
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    <span>{isDark ? "Світла тема" : "Темна тема"}</span>
                  </button>

                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Вийти</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Допоміжний компонент для пунктів випадаючого меню.
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {React.ReactNode} props.icon - Іконка з бібліотеки lucide-react.
 * @param {string} props.label - Текст пункту меню.
 * @param {Function} props.onClick - Функція, що викликається при кліку.
 * @returns {React.JSX.Element}
 */
function DropdownItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
