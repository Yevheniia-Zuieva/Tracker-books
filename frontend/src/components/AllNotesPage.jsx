/**
 * @file AllNotesPage.jsx
 * @description Сторінка глобального архіву нотаток користувача.
 * Реалізує інтерфейс для перегляду всіх думок з можливістю серверної
 * фільтрації (за улюбленими), сортування та пагінації.
 */

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom"; // Додано Link
import {
  ArrowLeft,
  Heart,
  Trash2,
  Edit2,
  Clock,
  Loader2,
  Save,
  ChevronDown,
  StickyNote,
} from "lucide-react";

import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { apiNotesQuotes } from "../api/ApiService";

/**
 * Головний компонент сторінки архіву нотаток.
 * @component
 * @returns {React.JSX.Element}
 */
const AllNotesPage = () => {
  const navigate = useNavigate();

  // --- СТАНИ ДАНИХ ТА ПАГІНАЦІЇ ---
  /** @type {[Array, Function]} Список поточних нотаток на екрані */
  const [notes, setNotes] = useState([]);

  /** @type {[number, Function]} Загальна кількість нотаток у базі (для лічильника) */
  const [totalNotes, setTotalNotes] = useState(0);

  /** @type {[boolean, Function]} Стан первинного завантаження */
  const [isLoading, setIsLoading] = useState(true);

  /** @type {[boolean, Function]} Стан завантаження наступної сторінки (Load More) */
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  /** @type {[string|null, Function]} URL наступної сторінки, отриманий від Django DRF */
  const [nextPageUrl, setNextPageUrl] = useState(null);

  // --- СТАНИ ФІЛЬТРАЦІЇ (СЕРВЕРНІ) ---
  /** @type {[string, Function]} Порядок сортування (за замовчуванням 'Спочатку нові') */
  const [sortOrder, setSortOrder] = useState("newest");

  /** @type {[boolean, Function]} Фільтр для відображення лише улюблених нотаток */
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  /** @type {[number|null, Function]} ID нотатки, яку потрібно редагувати */
  const [editingId, setEditingId] = useState(null);

  /** @type {[string, Function]} Тимчасовий текст нотатки під час редагування */
  const [editValue, setEditValue] = useState("");

  /**
   * Ефект ініціалізації та реакції на зміну фільтрів.
   * Перезапускає завантаження з першої сторінки при зміні сортування або улюблених.
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Завантажує нотатки з сервера, враховуючи пагінацію та фільтри.
   * @async
   * @param {string|null} url - Повний URL для пагінації. Якщо null, завантажується перша сторінка.
   * @param {boolean} reset - Якщо true, старий список повністю замінюється новими даними.
   */
  const loadData = async (url = null) => {
    try {
      if (!url) setIsLoading(true);
      else setIsMoreLoading(true);

      const data = await apiNotesQuotes.getAllNotes(url);

      // Збереження загальної кількості із поля count від Django DRF
      if (data.count !== undefined) {
        setTotalNotes(data.count);
      }

      const newResults = data.results || (Array.isArray(data) ? data : []);

      setNotes((prev) => {
        if (!url) return newResults;
        const existingIds = new Set(prev.map((note) => note.id));
        const uniqueNewResults = newResults.filter(
          (note) => !existingIds.has(note.id),
        );
        return [...prev, ...uniqueNewResults];
      });

      setNextPageUrl(data.next || null);
    } catch (error) {
      console.error("Помилка завантаження:", error);
    } finally {
      setIsLoading(false);
      setIsMoreLoading(false);
    }
  };

  /**
   * Перемикає статус "Улюблена" (isFavorite) для конкретної нотатки.
   * @async
   * @param {number} id - Унікальний ідентифікатор нотатки.
   * @param {boolean} currentStatus - Поточний стан прапорця.
   */
  const handleToggleFavorite = async (id, currentStatus) => {
    try {
      await apiNotesQuotes.updateNote(id, { isFavorite: !currentStatus });
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isFavorite: !currentStatus } : n,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Зберігає відредагований текст нотатки на сервері.
   * @async
   * @param {number} id - Унікальний ідентифікатор нотатки.
   */
  const handleUpdateNote = async (id) => {
    try {
      await apiNotesQuotes.updateNote(id, { content: editValue });
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, content: editValue } : n)),
      );
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Видаляє нотатку з бази даних після підтвердження.
   * @async
   * @param {number} id - Унікальний ідентифікатор нотатки.
   */
  const handleDeleteNote = async (id) => {
    if (window.confirm("Видалити цю нотатку?")) {
      try {
        await apiNotesQuotes.deleteNote(id);
        setNotes((prev) => prev.filter((n) => n.id !== id));
        setTotalNotes((prev) => prev - 1); // Зменшуємо загальний лічильник
      } catch (err) {
        console.error(err);
      }
    }
  };

  const processedNotes = useMemo(() => {
    let result = [...notes];
    if (onlyFavorites) result = result.filter((n) => n.isFavorite);

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      if (sortOrder === "newest") return dateB - dateA;
      if (sortOrder === "oldest") return dateA - dateB;
      if (sortOrder === "az")
        return (a.bookTitle || "").localeCompare(b.bookTitle || "");
      if (sortOrder === "za")
        return (b.bookTitle || "").localeCompare(a.bookTitle || "");
      return 0;
    });
    return result;
  }, [notes, sortOrder, onlyFavorites]);

  if (isLoading && notes.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">
          Завантаження архіву думок...
        </p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-left animate-in fade-in duration-500">
      {/* СЕКЦІЯ ЗАГОЛОВКА ТА ЛІЧИЛЬНИКА */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Усі нотатки</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Ваш інтелектуальний архів
            </p>
          </div>
        </div>

        {/* ОНОВЛЕНИЙ ЛІЧИЛЬНИК */}
        <div className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 flex flex-col items-end min-w-[140px]">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
            Завантажено
          </span>
          <span className="text-2xl font-black text-primary leading-none">
            {notes.length}{" "}
            <span className="text-sm font-medium opacity-60">
              / {totalNotes}
            </span>
          </span>
        </div>
      </div>

      {/* СЕКЦІЯ ФІЛЬТРАЦІЇ */}
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
                className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-background border border-border text-xs font-bold focus:ring-2 focus:ring-primary outline-none cursor-pointer"
              >
                <option value="newest">Спочатку нові</option>
                <option value="oldest">Спочатку старі</option>
                <option value="az">Книга (А-Я)</option>
                <option value="za">Книга (Я-А)</option>
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
            />{" "}
            Улюблені
          </Button>
        </div>
      </div>

      {/* СЕКЦІЯ СІТКИ (GRID) */}
      {processedNotes.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-[3rem] bg-muted/10">
          <StickyNote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium italic">
            Нотаток не знайдено.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedNotes.map((note) => (
              <Card
                key={note.id}
                className="group hover:shadow-2xl transition-all duration-500 border-l-4 border-l-primary bg-card flex flex-col overflow-hidden"
              >
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="space-y-1">
                    {/* КЛІКАБЕЛЬНА НАЗВА КНИГИ */}
                    <Link
                      to={`/books/${note.book}`}
                      className="block group/title"
                    >
                      <h3 className="font-black text-base leading-tight group-hover/title:text-primary transition-colors line-clamp-1 italic">
                        «{note.bookTitle || "Невідома книга"}»
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                      {note.bookAuthor || "Автор не вказаний"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                    <Clock className="h-3 w-3" />{" "}
                    {new Date(note.createdAt).toLocaleDateString("uk-UA")}
                  </div>

                  {/* Тіло нотатки */}
                  <div className="flex-1 bg-muted/30 p-4 rounded-2xl border border-border/40 relative min-h-[120px]">
                    {editingId === note.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="min-h-[100px] bg-background text-sm font-medium border-primary/20 focus-visible:ring-primary shadow-inner"
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
                            onClick={() => handleUpdateNote(note.id)}
                            className="h-7 px-3 text-[10px] uppercase font-bold"
                          >
                            <Save className="w-3 h-3 mr-1" /> Зберегти
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">
                        {note.content}
                      </p>
                    )}
                  </div>

                  {/* Панель дій */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                    <button
                      onClick={() =>
                        handleToggleFavorite(note.id, note.isFavorite)
                      }
                      className={`p-2 rounded-full transition-all ${note.isFavorite ? "text-red-500 bg-red-50" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      <Heart
                        className={`h-5 w-5 ${note.isFavorite ? "fill-current scale-110" : ""}`}
                      />
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditValue(note.content);
                        }}
                        className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ПАГІНАЦІЯ */}
          {nextPageUrl && (
            <div className="flex justify-center pt-10">
              <Button
                variant="outline"
                size="lg"
                onClick={() => loadData(nextPageUrl)}
                disabled={isMoreLoading}
                className="rounded-2xl px-10 border-primary text-primary hover:bg-primary/5 shadow-md font-black uppercase text-[10px] tracking-widest"
              >
                {isMoreLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Завантаження...
                  </>
                ) : (
                  "Завантажити ще нотатки"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllNotesPage;
