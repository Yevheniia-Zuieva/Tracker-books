import { Button } from "./ui/button";
import {
  BookOpen,
  CheckCircle,
  Bookmark,
  Heart,
  Tag,
  Star,
} from "lucide-react";

export function CategoryTabs({ activeCategory, onCategoryChange, bookCounts }) {
  const categories = [
    { id: "all", label: "Всі книги", icon: BookOpen },
    { id: "reading", label: "Читаю", icon: BookOpen },
    { id: "read", label: "Прочитано", icon: CheckCircle },
    { id: "want-to-read", label: "Хочу прочитати", icon: Bookmark },
    { id: "favorite", label: "Улюблені", icon: Heart },
    { id: "by-genre", label: "За жанром", icon: Tag },
    { id: "by-rating", label: "За рейтингом", icon: Star },
  ];

  return (
    <div className="bg-card p-3 md:p-4 rounded-lg shadow-sm border">
      <div className="flex flex-wrap gap-2">
        {categories.map(({ id, label, icon: Icon }) => {
          const isActive = activeCategory === id;

          return (
            <Button
              key={id}
              variant={isActive ? "default" : "outline"}
              onClick={() => onCategoryChange(id)}
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm h-9 px-3 md:px-4 transition-all"
            >
              <Icon className="w-3 h-3 md:w-4 md:h-4" />
              {label}
              {bookCounts?.[id] !== undefined && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium min-w-[1.25rem] text-center
                    ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                >
                  {bookCounts[id]}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
