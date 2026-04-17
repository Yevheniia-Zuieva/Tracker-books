import { Github, Heart, BookOpen } from "lucide-react";
// ДОДАНО: Імпорт Link для навігації
import { Link } from "react-router-dom";

/**
 * Компонент підвалу (Footer), адаптований під React Router.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background mt-auto">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        
        {/* Логотип та копірайт */}
        <div className="flex items-center gap-4">
          {/* ЗМІНЕНО: div з onClick замінено на Link */}
          <Link 
            to="/" 
            className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline text-sm">Tracker Books</span>
          </Link>
          <p className="text-[12px] text-muted-foreground border-l pl-4 hidden md:block">
            © {currentYear} Всі права захищені
          </p>
        </div>

        {/* Статус (центральна частина) */}
        <div className="hidden lg:flex items-center gap-1.5 text-[12px] text-muted-foreground italic">
          <span>Зроблено з</span>
          <Heart className="h-3 w-3 text-red-500 fill-current" />
          <span>для читачів</span>
        </div>

        {/* Навігація */}
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm font-medium">
            {/* ЗМІНЕНО: button замінено на Link з відповідним шляхом */}
            <Link 
              to="/about"
              className="text-muted-foreground hover:text-primary transition-colors text-xs"
            >
              Про проєкт
            </Link>
            <Link 
              to="/help"
              className="text-muted-foreground hover:text-primary transition-colors text-xs"
            >
              Допомога
            </Link>
          </nav>
          
          <a 
            href="https://github.com/Yevheniia-Zuieva/Tracker-books.git" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors border-l pl-4"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}