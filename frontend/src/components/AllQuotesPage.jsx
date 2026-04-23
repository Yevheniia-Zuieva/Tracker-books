/**
 * @file AllQuotesPage.jsx
 * @description Сторінка глобального архіву цитат користувача.
 * Реалізує інтерфейс для перегляду всіх збережених цитат з можливістю серверної
 * фільтрації (за улюбленими), сортування та коректної пагінації.
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Trash2,
  Edit2,
  Clock,
  Loader2,
  Save,
  ChevronDown,
  Quote as QuoteIcon,
} from "lucide-react";

import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { apiNotesQuotes } from "../api/ApiService";

/**
 * Головний компонент сторінки архіву цитат.
 * @component
 * @returns {React.JSX.Element}
 */
const AllQuotesPage = () => {
  const navigate = useNavigate();

  // --- СТАНИ ДАНИХ ТА ПАГІНАЦІЇ ---
  /** @type {[Array, Function]} Список поточних цитат на екрані */
  const [quotes, setQuotes] = useState([]);

  /** @type {[number, Function]} Загальна кількість цитат у базі (для лічильника) */
  const [totalQuotes, setTotalQuotes] = useState(0);

  /** @type {[boolean, Function]} Стан первинного завантаження сторінки */
  const [isLoading, setIsLoading] = useState(true);

  /** @type {[boolean, Function]} Стан завантаження наступної сторінки (Load More) */
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  /** @type {[string|null, Function]} URL наступної сторінки, отриманий від Django DRF */
  const [nextPageUrl, setNextPageUrl] = useState(null);

  // --- СТАНИ ДЛЯ СЕРВЕРНОЇ ФІЛЬТРАЦІЇ ---

  /** @type {[string, Function]} Порядок сортування (за замовчуванням '-createdAt' — найновіші) */
  const [sortOrder, setSortOrder] = useState("-createdAt");

  /** @type {[boolean, Function]} Прапорець відображення лише улюблених цитат */
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // --- СТАНИ РЕДАГУВАННЯ ---
  /** @type {[number|null, Function]} ID цитати, яка зараз редагується (null - режим перегляду) */
  const [editingId, setEditingId] = useState(null);

  /** @type {[string, Function]} Тимчасовий текст цитати під час редагування */
  const [editValue, setEditValue] = useState("");

  /**
   * Завантажує цитати з сервера, враховуючи пагінацію та параметри фільтрації.
   * @async
   * @param {string|null} [url=null] - Повний URL для пагінації. Якщо null, завантажується перша сторінка.
   * @param {boolean} [reset=false] - Якщо true, поточний список повністю очищується (використовується при зміні фільтрів).
   */
  const loadData = useCallback(async (url = null, reset = false) => {
    try {
      if (reset) setIsLoading(true);
      else setIsMoreLoading(true);

      const params = {};

      // Формуємо параметри тільки для початкового запиту (без пагінаційного URL)
      if (!url) {
        params.ordering = sortOrder;
        // Передаємо фільтр на бекенд, ТІЛЬКИ якщо кнопка активна
        if (onlyFavorites) {
          params.isFavorite = "true";
        }
      }

      // Виконуємо запит до API з передачею URL та зібраних параметрів
      const data = await apiNotesQuotes.getAllQuotes(url, params);
      const newResults = data.results || (Array.isArray(data) ? data : []);

      // Оновлюємо загальну кількість елементів
      if (data.count !== undefined) setTotalQuotes(data.count);

      setQuotes((prev) => {
        // Якщо змінено фільтри — повертаємо повністю новий список
        if (reset) return newResults;

        // Пагінація: Додаємо в КІНЕЦЬ масиву нові (старіші) результати
        // Використовуємо Set для запобігання дублюванню об'єктів за ID
        const existingIds = new Set(prev.map((q) => q.id));
        const uniqueItems = newResults.filter((q) => !existingIds.has(q.id));
        return [...prev, ...uniqueItems];
      });

      // Зберігаємо посилання на наступну сторінку для подальших завантажень
      setNextPageUrl(data.next || null);
    } catch (error) {
      console.error("Помилка:", error);
    } finally {
      setIsLoading(false);
      setIsMoreLoading(false);
    }
  }, [sortOrder, onlyFavorites]);

    /**
   * Ефект завантаження даних при зміні фільтрів або сортування.
   * Кожного разу, коли змінюється фільтр, ми починаємо з 1-ї сторінки.
   */
  useEffect(() => {
    loadData(null, true);
  }, [loadData]);
  
  /**
   * Перемикає статус "Улюблена" (isFavorite) для вибраної цитати.
   * Виконує локальне оптимістичне оновлення UI для швидкого відгуку.
   * * @async
   * @param {number} id - Ідентифікатор цитати.
   * @param {boolean} currentStatus - Поточний стан прапорця "Улюблена".
   */
  const handleToggleFavorite = async (id, currentStatus) => {
    try {
      await apiNotesQuotes.updateQuote(id, { isFavorite: !currentStatus });
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, isFavorite: !currentStatus } : q,
        ),
      );

      // Якщо увімкнено фільтр "Тільки улюблені", миттєво прибираємо картку з екрана після дизлайку
      if (onlyFavorites && currentStatus) {
        setQuotes((prev) => prev.filter((q) => q.id !== id));
        setTotalQuotes((p) => p - 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Зберігає відредагований текст цитати на сервері.
   * * @async
   * @param {number} id - Ідентифікатор цитати.
   */
  const handleUpdateQuote = async (id) => {
    try {
      await apiNotesQuotes.updateQuote(id, { content: editValue });
      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, content: editValue } : q)),
      );
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Видаляє цитату з бази даних після підтвердження користувачем.
   * * @async
   * @param {number} id - Ідентифікатор цитати для видалення.
   */
  const handleDeleteQuote = async (id) => {
    if (window.confirm("Видалити цю цитату?")) {
      try {
        await apiNotesQuotes.deleteQuote(id);
        setQuotes((prev) => prev.filter((q) => q.id !== id));
        setTotalQuotes((p) => p - 1);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- РЕНДЕРИНГ UI ---

  // Відображення головного спінера при первинному завантаженні сторінки
  if (isLoading && quotes.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">
          Завантаження вашої скарбниці...
        </p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-left animate-in fade-in duration-500">
      {/* HEADER: Заголовок та кнопка повернення */}
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
            <h1 className="text-2xl font-black tracking-tight">Усі цитати</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Скарбниця мудрих висловів
            </p>
          </div>
        </div>

        {/* ЛІЧИЛЬНИК: Показує співвідношення завантажених цитат до загальної кількості */}
        <div className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 flex flex-col items-end min-w-[140px]">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
            Завантажено
          </span>
          <span className="text-2xl font-black text-primary leading-none">
            {quotes.length}{" "}
            <span className="text-sm font-medium opacity-60">
              / {totalQuotes}
            </span>
          </span>
        </div>
      </div>

      {/* CONTROLS: Панель інструментів (сортування та фільтрація) */}
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
                <option value="-createdAt">Спочатку нові</option>
                <option value="createdAt">Спочатку старі</option>
                <option value="book__title">Книга (А-Я)</option>
                <option value="-book__title">Книга (Я-А)</option>
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
      </div>

      {/* GRID: Сітка відображення карток цитат */}
      {quotes.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-[3rem] bg-muted/10">
          <QuoteIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium italic">
            Цитат не знайдено.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quotes.map((quote) => (
              <Card
                key={quote.id}
                className="group hover:shadow-2xl transition-all duration-500 border-l-4 border-l-primary bg-card flex flex-col overflow-hidden"
              >
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="flex-1 bg-muted/30 p-5 rounded-2xl border border-border/40 relative">
                    <QuoteIcon className="absolute -top-2 -left-2 w-8 h-8 text-primary/10 rotate-12" />

                    {editingId === quote.id ? (
                      <div className="space-y-3 relative z-10">
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="min-h-[120px] bg-background text-sm font-serif italic border-primary/20 focus-visible:ring-primary shadow-inner"
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
                            onClick={() => handleUpdateQuote(quote.id)}
                            className="h-7 px-3 text-[10px] uppercase font-bold"
                          >
                            <Save className="w-3 h-3 mr-1" /> Зберегти
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-serif italic relative z-10">
                        «{quote.content}»
                      </p>
                    )}
                  </div>

                  {/* Панель метаданих та інструментів картки */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Link
                        to={`/books/${quote.book}`}
                        className="block group/title"
                      >
                        <h3 className="font-black text-sm leading-tight text-primary uppercase group-hover/title:underline transition-all">
                          {quote.bookTitle || "Невідома книга"}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                        <Clock className="h-3 w-3" />
                        {new Date(quote.createdAt).toLocaleDateString("uk-UA")}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          handleToggleFavorite(quote.id, quote.isFavorite)
                        }
                        className={`p-2 rounded-full transition-all ${quote.isFavorite ? "text-red-500 bg-red-50 dark:bg-red-950/20" : "text-muted-foreground hover:bg-muted"}`}
                      >
                        <Heart
                          className={`h-5 w-5 ${quote.isFavorite ? "fill-current scale-110" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(quote.id);
                          setEditValue(quote.content);
                        }}
                        className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
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

          {/* КНОПКА ЗАВАНТАЖИТИ ЩЕ */}
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
                  "Завантажити ще цитати"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllQuotesPage;
