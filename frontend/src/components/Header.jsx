import { Search, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "./ui/button";

/**
 * Компонент верхньої панелі навігації.
 * * @param {Object} props
 * @param {Object} props.user - Об'єкт поточного користувача.
 * @param {string} props.currentView - Поточний активний екран ('home' або 'search').
 * @param {Function} props.onViewChange - Функція для зміни поточного екрану.
 * @param {Function} props.onLogout - Функція для виходу з системи.
 */
export function Header({ user, currentView, onViewChange, onLogout }) {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        
        {/* Логотип (клікабельний -> веде на Home) */}
        <div
          className="flex items-center gap-2 font-bold text-xl cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onViewChange("home")}
        >
          <span>Tracker Books</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Кнопка Пошук книг */}
          <Button
            variant={currentView === "search" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("search")}
            className="hidden md:flex"
          >
            <Search className="h-4 w-4 mr-2" />
            Пошук книг
          </Button>

          {/* Мобільна версія кнопки пошуку */}
          <Button
            variant={currentView === "search" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewChange("search")}
            className="md:hidden"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Інформація про користувача */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <UserIcon className="h-4 w-4" />
            </div>
            <span className="hidden md:inline">
              {user?.username || user?.name || user?.email || "Користувач"}
            </span>
          </div>

          {/* Кнопка виходу */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            title="Вийти"
          >
            <LogOut className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </header>
  );
}