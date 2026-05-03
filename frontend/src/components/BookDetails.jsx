/**
 * @file BookDetails.jsx
 * @description Повна версія компонента деталей книги.
 * Включає автоматизацію дат, систему повторного читання (Reading Cycles),
 * інтегрований архів нотаток, колекцію цитат та таймер сесій.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Star,
  Heart,
  Play,
  Pause,
  Square,
  BookOpen,
  Trash2,
  Save,
  Loader2,
  Calendar,
  Quote,
  Clock,
  RotateCcw,
  History,
} from "lucide-react";

import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

import { apiBooks, apiNotesQuotes } from "../api/ApiService";

/**
 * Головний компонент детального перегляду книги.
 * @component
 * @returns {React.JSX.Element}
 */
const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- СТАНИ ОСНОВНИХ ДАНИХ ---
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- СТАНИ ТАЙМЕРА ТА РЕДАГУВАННЯ ---
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  // --- СТАНИ МОДАЛКИ ПОВТОРНОГО ЧИТАННЯ ---
  const [showReReadModal, setShowReReadModal] = useState(false);
  const [newStartDate, setNewStartDate] = useState("");

  // --- СТАНИ ДЛЯ НОТАТОК ТА ЦИТАТ ---
  const [localNote, setLocalNote] = useState("");
  const [noteStatus, setNoteStatus] = useState("idle");
  const [activeNoteId, setActiveNoteId] = useState(null);
  
  const [newQuote, setNewQuote] = useState("");
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  
  const [tempPage, setTempPage] = useState("");
  const [pageError, setPageError] = useState("");
  const [dates, setDates] = useState({ startDate: "", endDate: "" });

  /**
   * Завантажує всі дані про книгу з сервера.
   */
  const fetchBookData = useCallback(async () => {
    try {
      const data = await apiBooks.getBookDetail(id);
      setBook(data);

      setTempPage(data.currentPage || 0);
      setDates({
        startDate: data.startDate || "",
        endDate: data.endDate || "",
      });
    } catch (err) {
      console.error("Помилка завантаження", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBookData();
  }, [id, fetchBookData]);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const totalSeconds = useMemo(() => {
    return (book?.readingSessions || []).reduce(
      (acc, s) => acc + s.duration,
      0,
    );
  }, [book]);

  const isNoteModified = useMemo(() => {
    const original =
      book?.book_notes?.find((n) => n.id === activeNoteId)?.content || "";
    return localNote !== original;
  }, [localNote, book, activeNoteId]);

  const isQuoteModified = useMemo(() => {
    const original =
      book?.book_quotes?.find((q) => q.id === activeQuoteId)?.content || "";
    return newQuote !== original;
  }, [newQuote, book, activeQuoteId]);

  // --- ФУНКЦІЇ ПРОГРЕСУ ТА СТАТУСІВ ---

  const handlePageUpdate = async () => {
    const newPage = parseInt(tempPage, 10);
    if (isNaN(newPage) || newPage < 0) {
      setPageError("Введіть коректне число");
      return;
    }
    if (book.totalPages && newPage > book.totalPages) {
      setPageError(`Максимум ${book.totalPages}`);
      return;
    }

    let nextStatus = book.status;
    if (book.totalPages && newPage === book.totalPages) nextStatus = "read";
    else if (newPage > 0 && book.status === "want-to-read")
      nextStatus = "reading";

    try {
      const updated = await apiBooks.updateBook(id, {
        currentPage: newPage,
        status: nextStatus,
      });
      setBook((prev) => ({ ...prev, ...updated }));
      setIsEditingProgress(false);
      setPageError("");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Відкриває модальне вікно для повторного читання
   * та встановлює сьогоднішню дату за замовчуванням.
   */
  const handleOpenReReadModal = () => {
    setNewStartDate(new Date().toISOString().split("T")[0]);
    setShowReReadModal(true);
  };

  /**
   * Логіка повторного читання.
   * 1. Архівує минулий цикл на бекенді.
   * 2. Встановлює нову дату, яку обрав користувач.
   * 3. Примусово оновлює всі дані (fetchBookData), щоб історія з'явилася миттєво.
   */
  const submitReRead = async () => {
    try {
      await apiBooks.startReReading(id);
      
      // Якщо користувач обрав іншу дату, оновлюємо її окремо
      if (newStartDate) {
        await apiBooks.updateBook(id, { startDate: newStartDate });
      }

      await fetchBookData(); 
      setTempPage(0);
      setShowReReadModal(false);
    } catch (err) {
      console.error("Помилка:", err);
      alert("Не вдалося розпочати нове читання.");
    }
  };

  // --- ФУНКЦІЇ НОТАТОК ТА ЦИТАТ ---

  const handleSaveNote = async () => {
    if (!localNote.trim()) return;
    setNoteStatus("saving");
    try {
      if (activeNoteId) {
        // Оновлюємо існуючу
        await apiNotesQuotes.updateNote(activeNoteId, { content: localNote });
      } else {
        // Створюємо нову
        await apiNotesQuotes.addNote(id, localNote);
      }
      
      setLocalNote("");
      setActiveNoteId(null);
      
      setNoteStatus("saved");
      fetchBookData(); // Оновлюємо дані на екрані
      setTimeout(() => setNoteStatus("idle"), 3000);
    } catch (err) {
      console.error("Помилка збереження нотатки:", err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Видалити цю нотатку?")) return;
    try {
      await apiNotesQuotes.deleteNote(noteId);
      if (activeNoteId === noteId) {
        setActiveNoteId(null);
        setLocalNote("");
      }
      fetchBookData();
    } catch (err) { console.error(err); }
  };

  const handleSaveQuote = async () => {
    if (!newQuote.trim()) return;
    try {
      if (activeQuoteId)
        await apiNotesQuotes.updateQuote(activeQuoteId, { content: newQuote });
      else await apiNotesQuotes.addQuote(id, newQuote);
      setNewQuote("");
      setActiveQuoteId(null);
      fetchBookData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm("Видалити цитату?")) return;
    try {
      await apiNotesQuotes.deleteQuote(quoteId);
      fetchBookData();
    } catch (err) { console.error(err); }
  };

  const handleUpdateField = async (field, value) => {
    try {
      const updated = await apiBooks.updateBook(id, { [field]: value });
      setBook((prev) => ({ ...prev, ...updated }));
      if (field === "startDate" || field === "endDate")
        setIsEditingDates(false);
    } catch (err) { console.error(err); }
  };

  const formatTotalTime = (s) => {
    if (!s) return "0с";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}г ${m}хв ${s % 60}с`;
  };

  const handleFinishSession = async () => {
    setIsTimerRunning(false);
    try {
      await apiBooks.addSession(id, { duration: seconds });
      setSeconds(0);
      fetchBookData();
    } catch (err) { console.error("Помилка збереження сесії:", err); }
  };

  // --- РЕНДЕРИНГ ---

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  if (!book) return <div className="p-20 text-center">Книга не знайдена</div>;

  const progressPercent =
    Math.round((book.currentPage / (book.totalPages || 1)) * 100) || 0;
  const sessionsToShow = showAllSessions
    ? book.readingSessions || []
    : (book.readingSessions || []).slice(-5).reverse();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-left animate-in fade-in duration-500">
      <Link
        to="/"
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 w-fit"
      >
        <ArrowLeft size={18} />{" "}
        <span className="font-medium">Назад до бібліотеки</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ЛІВА КОЛОНКА */}
        <div className="lg:col-span-4 space-y-6">
          <img
            src={book.cover}
            alt={book.title}
            className="w-full rounded-2xl shadow-2xl border object-cover aspect-[2/3]"
          />
          <div className="space-y-3 text-center lg:text-left">
            <h1 className="text-3xl font-bold">{book.title}</h1>
            <p className="text-xl text-muted-foreground italic">
              {book.author}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
              <Badge className="uppercase">
                {book.status === "reading"
                  ? "Читаю"
                  : book.status === "read"
                    ? "Прочитано"
                    : "В планах"}
              </Badge>
              {book.status === "read" && (
                <Button
                  onClick={handleOpenReReadModal}
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] font-bold gap-1 rounded-full border-primary text-primary hover:bg-primary/10 transition-colors"
                >
                  <RotateCcw size={12} /> ЧИТАТИ ЗНОВУ
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ПРАВА КОЛОНКА */}
        <div className="lg:col-span-8 space-y-8">
          {/* КОРОТКИЙ ЗМІСТ */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                  Короткий зміст
                </h3>
                <p className="text-sm leading-relaxed">
                  {book.description || "Опис відсутній"}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <DetailItem label="Жанр" value={book.genre} />
                <DetailItem label="Рік" value={book.year} />
                <DetailItem label="Сторінок" value={book.totalPages} />
                <DetailItem
                  label="Додано"
                  value={new Date(book.addedDate).toLocaleDateString()}
                />
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      onClick={() => handleUpdateField("rating", s)}
                      className={`h-6 w-6 cursor-pointer ${s <= (book.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
                <Button
                  variant={book.isFavorite ? "destructive" : "secondary"}
                  onClick={() =>
                    handleUpdateField("isFavorite", !book.isFavorite)
                  }
                  className="gap-2"
                >
                  <Heart
                    size={16}
                    className={book.isFavorite ? "fill-current" : ""}
                  />
                  {book.isFavorite ? "З обраного" : "В обране"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ПРОГРЕС */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <BookOpen className="text-primary" /> Прогрес читання
                </h3>
                <button
                  onClick={() => {
                    setIsEditingProgress(!isEditingProgress);
                    setPageError("");
                  }}
                  title="Редагувати"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full border overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span>{progressPercent}% виконано</span>
                <span className="text-muted-foreground">
                  {book.currentPage} / {book.totalPages} сторінок
                </span>
              </div>
              {isEditingProgress && (
                <div className="space-y-2 animate-in slide-in-from-top-2 pt-2 border-t mt-2">
                  <div className="flex gap-2 items-center pt-2">
                    <Input
                      type="text"
                      value={tempPage}
                      onChange={(e) =>
                        setTempPage(e.target.value.replace(/\D/g, ""))
                      }
                      className={`max-w-[120px] ${pageError ? "border-destructive" : ""}`}
                      placeholder="Стор."
                    />
                    <Button size="sm" onClick={handlePageUpdate}>
                      Оновити
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingProgress(false)}
                    >
                      Скасувати
                    </Button>
                  </div>
                  {pageError && (
                    <p className="text-[10px] text-destructive font-bold uppercase">
                      {pageError}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ІСТОРІЯ ТА ЦИКЛИ */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <History className="text-primary" size={18} /> Історія читання
                </h3>
                <button onClick={() => setIsEditingDates(!isEditingDates)}>
                  <Calendar size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {/* ПОТОЧНИЙ ЦИКЛ */}
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {book.status === "read" ? <RotateCcw size={16} /> : "➤"}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">
                        Поточне читання
                      </p>
                      <p className="text-sm font-medium">
                        {book.startDate
                          ? new Date(book.startDate).toLocaleDateString("uk-UA")
                          : book.status === "reading"
                            ? "Сьогодні"
                            : "Ще не розпочато"}
                        <span className="mx-2 text-muted-foreground">—</span>
                        {book.endDate
                          ? new Date(book.endDate).toLocaleDateString("uk-UA")
                          : book.startDate
                            ? "читаю зараз"
                            : "..."}
                      </p>
                    </div>
                  </div>
                  {book.status === "read" ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase"
                    >
                      Прочитано
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase text-primary border-primary"
                    >
                      У процесі
                    </Badge>
                  )}
                </div>

                {/* АРХІВНІ ЦИКЛИ */}
                {book.reading_cycles?.map((cycle, index) => (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between p-4 bg-muted/10 rounded-xl border opacity-80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
                        {book.reading_cycles.length - index}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">
                          Архівний період
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(cycle.start_date).toLocaleDateString(
                            "uk-UA",
                          )}
                          <span className="mx-2 text-muted-foreground">—</span>
                          {new Date(cycle.end_date).toLocaleDateString("uk-UA")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="ghost"
                      className="text-[10px] uppercase opacity-50"
                    >
                      Архів
                    </Badge>
                  </div>
                ))}

                {isEditingDates && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-muted/10 border rounded-xl animate-in zoom-in-95 mt-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase px-1 text-muted-foreground">
                        Змінити початок
                      </p>
                      <Input
                        type="date"
                        value={dates.startDate}
                        onChange={(e) =>
                          setDates({ ...dates, startDate: e.target.value })
                        }
                        onBlur={() =>
                          handleUpdateField("startDate", dates.startDate)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase px-1 text-muted-foreground">
                        Змінити фініш
                      </p>
                      <Input
                        type="date"
                        value={dates.endDate}
                        onChange={(e) =>
                          setDates({ ...dates, endDate: e.target.value })
                        }
                        onBlur={() =>
                          handleUpdateField("endDate", dates.endDate)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ТАЙМЕР ТА ІСТОРІЯ СЕСІЙ */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">
                    Загальний час
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatTotalTime(totalSeconds)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">
                    Всього сесій
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {book.readingSessions?.length || 0}
                  </p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="text-5xl font-mono font-bold py-2 text-primary">
                  {new Date(seconds * 1000).toISOString().substr(11, 8)}
                </div>
                <div className="flex justify-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="w-48 rounded-xl shadow-md"
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="mr-2" /> Пауза
                      </>
                    ) : (
                      <>
                        <Play className="mr-2" /> Читати
                      </>
                    )}
                  </Button>
                  {seconds > 0 && (
                    <Button
                      variant="destructive"
                      onClick={handleFinishSession}
                      className="rounded-xl shadow-md px-6"
                    >
                      <Square size={18} />
                    </Button>
                  )}
                </div>
              </div>
              <div className="pt-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest border-b pb-2 flex items-center gap-2">
                  <Clock size={14} /> Останні сесії
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sessionsToShow.map((s, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 bg-background rounded-xl border text-sm shadow-sm"
                    >
                      <span className="font-bold text-primary">
                        {formatTotalTime(s.duration)}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        {new Date(s.date).toLocaleDateString("uk-UA")}
                      </span>
                    </div>
                  ))}
                </div>
                {book.readingSessions?.length > 5 && (
                  <button
                    onClick={() => setShowAllSessions(!showAllSessions)}
                    className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline w-full text-center mt-2 pt-2"
                  >
                    {showAllSessions
                      ? "Приховати старі записи"
                      : `Показати всі ${book.readingSessions.length} сесій →`}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* НОТАТКИ */}
          <Card className="rounded-[2.5rem] shadow-sm overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <h3 className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2 text-primary">
                <Edit2 size={16} /> Мій архів думок
              </h3>

              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                {book.book_notes?.length === 0 && (
                  <p className="text-xs italic text-muted-foreground text-center py-10 opacity-60">
                    Ваш архів порожній. Час додати першу нотатку?
                  </p>
                )}

                {book.book_notes?.map((n) => (
                  <div
                    key={n.id}
                    className={`group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      activeNoteId === n.id
                        ? "border-primary bg-primary/[0.03] shadow-md scale-[1.01]"
                        : "bg-background border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${activeNoteId === n.id ? "bg-primary" : "bg-muted-foreground/20 group-hover:bg-primary/40"}`}
                    />

                    <div className="flex justify-between items-start gap-4 pl-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-relaxed mb-3 whitespace-pre-wrap text-foreground/90">
                          {n.content}
                        </p>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted/40 px-2 py-1 rounded-md">
                          {new Date(n.createdAt).toLocaleDateString("uk-UA")}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setLocalNote(n.content);
                            setActiveNoteId(n.id);
                          }}
                          className="p-2 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                          title="Редагувати"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="p-2 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Видалити"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-dashed">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {activeNoteId ? "Редагування запису" : "Нова нотатка"}
                  </span>
                  {isNoteModified && (
                    <span className="text-[10px] text-orange-500 font-bold animate-pulse uppercase bg-orange-50 px-2 py-0.5 rounded-md">
                      Є зміни
                    </span>
                  )}
                </div>
                <Textarea
                  value={localNote}
                  onChange={(e) => {
                    setLocalNote(e.target.value);
                    if (noteStatus === "saved") setNoteStatus("idle");
                  }}
                  placeholder="Запишіть свої враження або ідеї..."
                  className={`min-h-[100px] rounded-xl shadow-inner text-sm transition-colors p-3 ${isNoteModified ? "bg-orange-50/30" : "bg-background"}`}
                />
                <div className="mt-3 space-y-2">
                  <Button
                    onClick={handleSaveNote}
                    disabled={
                      noteStatus === "saving" ||
                      !localNote.trim() ||
                      (!isNoteModified && activeNoteId)
                    }
                    className="w-full rounded-xl gap-2 font-bold text-sm"
                  >
                    {noteStatus === "saving" ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <Save size={16} />
                    )}{" "}
                    {activeNoteId ? "Оновити цей запис" : "Зберегти в архів"}
                  </Button>
                  {activeNoteId && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNoteId(null);
                        setLocalNote("");
                      }}
                      className="text-xs text-muted-foreground hover:text-primary w-full text-center py-1 transition-colors"
                    >
                      Скасувати редагування →
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ЦИТАТИ */}
          <Card className="rounded-[2.5rem] shadow-sm overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <h3 className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2 text-primary">
                <Quote size={18} /> Колекція висловів
              </h3>

              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                {book.book_quotes?.length === 0 && (
                  <p className="text-xs italic text-muted-foreground text-center py-10 opacity-60">
                    Тут будуть збережені ваші улюблені цитати.
                  </p>
                )}

                {book.book_quotes?.map((q) => (
                  <div
                    key={q.id}
                    className={`group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      activeQuoteId === q.id
                        ? "border-primary bg-primary/[0.03] shadow-md scale-[1.01]"
                        : "bg-background border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${activeQuoteId === q.id ? "bg-primary" : "bg-primary/20 group-hover:bg-primary/40"}`}
                    />

                    <div className="flex justify-between items-start gap-4 pl-2 relative">
                      <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/10 rotate-12 z-0" />

                      <div className="flex-1 relative z-10">
                        <p className="text-sm font-serif italic leading-relaxed mb-3 whitespace-pre-wrap text-foreground/90">
                          «{q.content}»
                        </p>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted/40 px-2 py-1 rounded-md">
                          {new Date(q.createdAt).toLocaleDateString("uk-UA")}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                        <button
                          onClick={() => {
                            setNewQuote(q.content);
                            setActiveQuoteId(q.id);
                          }}
                          className="p-2 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                          title="Редагувати"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuote(q.id)}
                          className="p-2 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Видалити"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Форма додавання/редагування */}
              <div className="pt-6 border-t border-border/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    {activeQuoteId
                      ? "Редагування цитати"
                      : "Додати нову цитату"}
                  </span>
                  {isQuoteModified && (
                    <span className="text-[9px] text-orange-500 font-black animate-pulse uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-full">
                      Незбережені зміни
                    </span>
                  )}
                </div>
                <Textarea
                  value={newQuote}
                  onChange={(e) => {
                    setNewQuote(e.target.value);
                  }}
                  placeholder="Запишіть влучний вислів..."
                  className={`min-h-[140px] rounded-2xl border-none shadow-inner font-serif italic text-sm transition-colors duration-500 p-5 ${isQuoteModified ? "bg-orange-50/30" : "bg-muted/20"}`}
                />
                <div className="mt-4 space-y-3">
                  <Button
                    onClick={handleSaveQuote}
                    disabled={
                      !newQuote.trim() || (!isQuoteModified && activeQuoteId)
                    }
                    className="w-full h-12 rounded-2xl gap-3 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/10"
                  >
                    <Save size={16} />{" "}
                    {activeQuoteId
                      ? "Оновити цю цитату"
                      : "Зберегти в колекцію"}
                  </Button>
                  {activeQuoteId && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveQuoteId(null);
                        setNewQuote("");
                      }}
                      className="text-[10px] text-muted-foreground font-black uppercase tracking-widest hover:text-primary w-full text-center py-2 transition-colors"
                    >
                      Скасувати та додати нову →
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="pt-8">
            <Button
              variant="ghost"
              className="text-destructive w-full py-8 border border-dashed border-destructive/30 hover:bg-destructive/10 gap-2 rounded-2xl transition-all group"
              onClick={() => {
                if (window.confirm("Видалити всю книгу? Це назавжди."))
                  apiBooks.deleteBook(id).then(() => navigate("/"));
              }}
            >
              <Trash2
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-bold text-sm">Видалити з бібліотеки</span>
            </Button>
          </div>
        </div>
      </div>

      {/* МОДАЛЬНЕ ВІКНО ПОВТОРНОГО ЧИТАННЯ */}
      {showReReadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 border animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <RotateCcw size={24} />
              </div>
              <h3 className="text-xl font-black">Нова подорож книгою</h3>
              <p className="text-sm text-muted-foreground">
                Ви вже прочитали цю книгу. Попередній прогрес та дати будуть надійно збережені у вашому архіві.
              </p>
            </div>

            <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">
                Дата початку нового читання
              </label>
              <Input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="bg-background cursor-pointer"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl" 
                onClick={() => setShowReReadModal(false)}
              >
                Скасувати
              </Button>
              <Button 
                className="flex-1 rounded-xl gap-2 font-bold" 
                onClick={submitReRead}
              >
                <Play size={16} /> Почати читати
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Допоміжний компонент для відображення пар "Мітка-Значення" у короткому змісті.
 * @param {Object} props
 * @param {string} props.label - Назва поля (напр., "Жанр").
 * @param {string|number} props.value - Значення поля.
 * @returns {React.JSX.Element}
 */
const DetailItem = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
      {label}
    </p>
    <p className="text-sm font-bold">{value || "—"}</p>
  </div>
);

export default BookDetails;