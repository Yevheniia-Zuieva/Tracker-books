import { Github, Heart, BookOpen } from "lucide-react";

/**
 * Компонент підвалу (Footer), синхронізований за розміром із хедером.
 * @param {Object} props
 * @param {Function} props.onViewChange - Функція для перемикання екранів.
 */
export function Footer({ onViewChange }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background mt-auto">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        
        {/* Логотип та копірайт */}
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-2 font-bold cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onViewChange("home")}
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline text-sm">Tracker Books</span>
          </div>
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
            <button 
              onClick={() => onViewChange("about")}
              className="text-muted-foreground hover:text-primary transition-colors text-xs"
            >
              Про проєкт
            </button>
            <button 
              onClick={() => onViewChange("help")}
              className="text-muted-foreground hover:text-primary transition-colors text-xs"
            >
              Допомога
            </button>
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