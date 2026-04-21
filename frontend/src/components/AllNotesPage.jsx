/**
 * @file Сторінка архіву всіх нотаток користувача.
 * @description Компонент забезпечує централізований інтерфейс для перегляду,
 * редагування, видалення та фільтрації всіх текстових нотаток, залишених до книг.
 * Реалізує складну логіку сортування та мемоізації для оптимізації рендерингу.
 */
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Trash2,
  Edit2,
  Clock,
  Loader2,
  Save,
  ChevronDown,
} from "lucide-react";

import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

import { apiBooks } from "../api/ApiService";

/**
 * Компонент AllNotesPage.
 * Надає користувачеві можливість працювати з усіма думками, зафіксованими під час читання,
 * незалежно від конкретної книги.
 * * @component
 * @returns {React.JSX.Element} Сторінка з архівом нотаток та інструментами керування.
 */
const AllNotesPage = () => {
  const navigate = useNavigate();

  /** @type {[Array, Function]} Список книг, що містять нотатки */
  const [books, setBooks] = useState([]);

  /** @type {[boolean, Function]} Стан завантаження даних із сервера */
  const [isLoading, setIsLoading] = useState(true);

  /** @type {[string, Function]} Порядок сортування (newest|oldest|az|za) */
  const [sortOrder, setSortOrder] = useState("newest");

  /** @type {[boolean, Function]} Фільтр лише для обраних нотаток */
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  /** @type {[number|null, Function]} ID нотатки, яка зараз редагується */
  const [editingId, setEditingId] = useState(null);

  /** @type {[string, Function]} Тимчасове значення тексту при редагуванні */
  const [editValue, setEditValue] = useState("");

  /** Ефект початкового завантаження даних при монтуванні сторінки */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Завантаження даних про книги та фільтрація тих, що мають нотатки.
   * @async
   * @function loadData
   */
  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await apiBooks.getAllBooks();
      // Фільтруємо лише ті книги, де є нотатки
      const booksWithNotes = (
        Array.isArray(data) ? data : data.results || []
      ).filter((book) => book.note && book.note.trim() !== "");
      setBooks(booksWithNotes);
    } catch (error) {
      console.error("Помилка завантаження:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Перемикання статусу "Обране" для книги/нотатки.
   * @async
   * @param {number} id - ID книги.
   * @param {boolean} currentStatus - Поточний статус обраного.
   */
  const handleToggleFavorite = async (id, currentStatus) => {
    try {
      await apiBooks.updateBook(id, { isFavorite: !currentStatus });
      setBooks((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, isFavorite: !currentStatus } : b,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Збереження зміненого тексту нотатки.
   * @async
   * @param {number} id - ID книги.
   */
  const handleUpdateNote = async (id) => {
    try {
      await apiBooks.updateBook(id, { note: editValue });
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, note: editValue } : b)),
      );
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Видалення нотатки (очищення поля note у об'єкті книги).
   * @async
   * @param {number} id - ID книги.
   */
  const handleDeleteNote = async (id) => {
    if (window.confirm("Видалити цю нотатку?")) {
      try {
        await apiBooks.updateBook(id, { note: "" });
        setBooks((prev) => prev.filter((b) => b.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  /**
   * Обробка та підготовка списку нотаток.
   * Використовує `useMemo` для запобігання зайвих обчислень при зміні стану редагування.
   * Реалізує фільтрацію за обраним та сортування за 4 критеріями.
   * @type {Array}
   */
  const processedNotes = useMemo(() => {
    let result = [...books];
    if (onlyFavorites) result = result.filter((b) => b.isFavorite);

    result.sort((a, b) => {
      if (sortOrder === "newest")
        return (
          new Date(b.updated_at || b.addedDate) -
          new Date(a.updated_at || a.addedDate)
        );
      if (sortOrder === "oldest")
        return (
          new Date(a.updated_at || a.addedDate) -
          new Date(b.updated_at || b.addedDate)
        );
      if (sortOrder === "az") return a.title.localeCompare(b.title);
      if (sortOrder === "za") return b.title.localeCompare(a.title);
      return 0;
    });
    return result;
  }, [books, sortOrder, onlyFavorites]);

  /** Рендеринг стану завантаження */
  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">
          Завантаження архіву думкок...
        </p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-left animate-in fade-in duration-500">
      {/* HEADER: Заголовок та статистика */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Усі нотатки</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Тут зібрані всі ваші думки
            </p>
          </div>
        </div>

        <div className="bg-primary/10 px-6 py-2 rounded-2xl border border-primary/20 flex flex-col items-end">
          <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
            Всього в системі
          </span>
          <span className="text-2xl font-black text-primary leading-none">
            {processedNotes.length}
          </span>
        </div>
      </div>

      {/* ПАНЕЛЬ КЕРУВАННЯ: Сортування та Фільтри */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">
              Сортувати:
            </label>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-background border border-border text-xs font-bold focus:ring-2 focus:ring-primary outline-none cursor-pointer hover:border-primary/50 transition-colors"
              >
                <option value="newest">Спочатку нові</option>
                <option value="oldest">Спочатку старі</option>
                <option value="az">Назва (А-Я)</option>
                <option value="za">Назва (Я-А)</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <Button
            variant={onlyFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`h-9 rounded-xl px-4 gap-2 font-bold text-xs uppercase transition-all ${onlyFavorites ? "shadow-lg shadow-primary/20" : ""}`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${onlyFavorites ? "fill-current" : ""}`}
            />
            Улюблені
          </Button>
        </div>

        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">
          Показано архівних записів: {processedNotes.length}
        </p>
      </div>

      {/* GRID: Відображення карток нотаток */}
      {processedNotes.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-[3rem] bg-muted/10">
          <p className="text-muted-foreground font-medium italic">
            Нотаток не знайдено за вашим запитом.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedNotes.map((book) => (
            <Card
              key={book.id}
              className="group hover:shadow-2xl transition-all duration-500 border-l-4 border-l-primary bg-card flex flex-col overflow-hidden"
            >
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="space-y-1">
                  <h3 className="font-black text-base leading-tight group-hover:text-primary transition-colors line-clamp-1 italic">
                    «{book.title}»
                  </h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    {book.author}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                  <Clock className="h-3 w-3" />
                  {new Date(
                    book.updated_at || book.addedDate,
                  ).toLocaleDateString("uk-UA")}
                </div>

                <div className="flex-1 bg-muted/30 p-4 rounded-2xl border border-border/40 relative min-h-[120px]">
                  {editingId === book.id ? (
                    <div className="space-y-3 animate-in zoom-in-95 duration-200">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="min-h-[100px] bg-background text-sm font-medium border-primary/20 focus-visible:ring-primary"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="h-7 text-[10px] uppercase font-bold"
                        >
                          Скасувати
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(book.id)}
                          className="h-7 px-3 text-[10px] uppercase font-bold"
                        >
                          <Save className="w-3 h-3 mr-1" /> Зберегти
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">
                      {book.note}
                    </p>
                  )}
                </div>

                {/* FOOTER: Панель дій над конкретною нотаткою */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                  <button
                    onClick={() =>
                      handleToggleFavorite(book.id, book.isFavorite)
                    }
                    className={`p-2 rounded-full transition-all ${book.isFavorite ? "text-red-500 bg-red-50 dark:bg-red-950/20" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <Heart
                      className={`h-5 w-5 ${book.isFavorite ? "fill-current scale-110" : ""}`}
                    />
                  </button>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(book.id);
                        setEditValue(book.note);
                      }}
                      className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      title="Редагувати"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(book.id)}
                      className="p-2 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Видалити"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllNotesPage;
