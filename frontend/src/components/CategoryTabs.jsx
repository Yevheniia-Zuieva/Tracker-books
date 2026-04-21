/**
 * @file Компонент навігаційних вкладок категорій бібліотеки.
 * @description Забезпечує інтерфейс фільтрації списку книг за статусами читання,
 * оцінкою, жанрами та персональними вподобаннями. Підтримує відображення
 * динамічних лічильників (бейджів) для кожної категорії.
 */

import { Button } from "./ui/button";
import {
  BookOpen,
  CheckCircle,
  Bookmark,
  Heart,
  Tag,
  Star,
} from "lucide-react";

/**
 * Компонент CategoryTabs.
 * Надає користувачеві можливість візуально оцінити обсяг своєї бібліотеки та
 * швидко відфільтрувати книги за логічними групами.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} props.activeCategory - Ідентифікатор поточної вибраної категорії.
 * @param {Function} props.onCategoryChange - Функція зворотного виклику, що ініціює зміну фільтрації.
 * @param {Object.<string, number>} [props.bookCounts] - Словник, де ключ — ID категорії, а значення — кількість книг у ній.
 * @returns {React.JSX.Element} Панель фільтрації з інтерактивними кнопками.
 */
export function CategoryTabs({ activeCategory, onCategoryChange, bookCounts }) {
  /**
   * Конфігурація доступних категорій для фільтрації.
   * Визначає порядок відображення, текстові мітки та іконки.
   * @type {Array<{id: string, label: string, icon: React.ComponentType}>}
   */
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
          /** @type {boolean} Перевірка, чи є поточна вкладка активною */
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
              {/* Відображення динамічного лічильника книг */}
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
