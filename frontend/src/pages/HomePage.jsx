/**
 * @file Головна сторінка застосунку "Tracker Books" (Персональна бібліотека).
 * @description Центральний компонент для менеджменту книг користувача.
 * Реалізує асинхронне завантаження даних, серверну фільтрацію,
 * складне сортування, пошук реального часу та класичну посторінкову пагінацію.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { apiBooks, apiNotesQuotes } from "../api/ApiService";
import {
  Loader2, RotateCcw, Star, Tag, BookPlus, Search, 
  User as UserIcon, Calendar, Clock, TrendingUp, ListFilter, ChevronDown, Check,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const SORT_OPTIONS = {
  groups: [
    { id: "genre", icon: Tag, label: "За жанром" },
    { id: "author", icon: UserIcon, label: "За автором" },
    { id: "year", icon: Calendar, label: "За роком видання" },
  ],
  lists: [
    { id: "added-desc", icon: Clock, label: "Спочатку нові (додані)" },
    { id: "added-asc", icon: Clock, label: "Спочатку старі (додані)" },
    { id: "progress-desc", icon: TrendingUp, label: "З найбільшим прогресом" },
    { id: "rating-desc", icon: Star, label: "Найкращий рейтинг (5-1)" },
    { id: "rating-asc", icon: Star, label: "Найнижчий рейтинг (1-5)" },
    { id: "year-desc", icon: Calendar, label: "Найновіші видання" },
    { id: "year-asc", icon: Calendar, label: "Найстаріші видання" },
  ]
};

export default function HomePage() {
  const navigate = useNavigate();
  const searchContainerRef = useRef(null);
  const sortContainerRef = useRef(null);

  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- ПАГІНАЦІЯ ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 20; // Кількість книг на одній сторінці
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  
  const [stats, setStats] = useState({
    all: 0, reading: 0, read: 0, want: 0, fav: 0, custom: 0
  });

  const [currentFilter, setCurrentFilter] = useState("all");
  const [currentSort, setCurrentSort] = useState("added-desc"); 
  const [isSortOpen, setIsSortOpen] = useState(false); 
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiBooks.getStats();
      setStats({
        all: data.totalBooks || data.all || 0,
        read: data.readCount || data.read || 0,
        reading: data.reading || 0,
        want: data.want || 0,
        fav: data.fav || 0,
        custom: data.customCount ?? 0, // Безпечний fallback на 0
      });
    } catch (error) {
      console.error("Помилка статистики:", error);
    }
  }, []);

  const loadBooks = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);

        const params = { page: page }; // Передаємо сторінку на бекенд
        
        if (currentFilter === "favorite") params.isFavorite = "true";
        else if (currentFilter === "custom") params.isCustom = "true";
        else if (currentFilter !== "all") params.status = currentFilter;

        if (currentSort && !["genre", "author", "year"].includes(currentSort)) {
          params.sort = currentSort; 
        }

        const data = await apiBooks.getAllBooks(null, params);
        const fetchedResults = data.results || (Array.isArray(data) ? data : []);

        // Для класичної пагінації ми завжди ЗАМІНЮЄМО масив, а не додаємо до нього
        setBooks(fetchedResults);
        
        // DRF зазвичай віддає загальну кількість у полі count
        setTotalItems(data.count || fetchedResults.length || 0);
        setCurrentPage(page);

      } catch (error) {
        console.error("Помилка:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentFilter, currentSort]
  );

  // Завантаження при зміні фільтрів (завжди скидаємо на 1 сторінку)
  useEffect(() => {
    loadBooks(1);
    loadStats();
  }, [currentFilter, currentSort, loadBooks, loadStats]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) setIsSearchFocused(false);
      if (sortContainerRef.current && !sortContainerRef.current.contains(event.target)) setIsSortOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ОБРОБНИКИ ДІЙ З КНИГАМИ ---
  const handleStatusChange = async (id, nextStatus) => {
    const book = books.find((b) => b.id === id);
    const oldStatus = book?.status;

    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status: nextStatus } : b)));
    setStats((prev) => {
      const newStats = { ...prev };
      if (oldStatus === "want-to-read") newStats.want--;
      else if (oldStatus === "reading") newStats.reading--;
      else if (oldStatus === "read") newStats.read--;

      if (nextStatus === "want-to-read") newStats.want++;
      else if (nextStatus === "reading") newStats.reading++;
      else if (nextStatus === "read") newStats.read++;
      return newStats;
    });

    try { await apiBooks.updateBook(id, { status: nextStatus }); } 
    catch (error) { console.error("Помилка:", error); loadStats(); }
  };

  const handleToggleFavorite = async (id) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    const newFavState = !book.isFavorite;

    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, isFavorite: newFavState } : b)));
    setStats((prev) => ({ ...prev, fav: newFavState ? prev.fav + 1 : prev.fav - 1 }));

    try { await apiBooks.updateBook(id, { isFavorite: newFavState }); } 
    catch (error) { console.error("Помилка:", error); loadStats(); }
  };

  const handleDelete = async (book) => {
    if (window.confirm(`Видалити "${book.title}"?`)) {
      const oldStatus = book.status;
      const wasFavorite = book.isFavorite;
      const wasCustom = book.isCustom;

      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      setStats((prev) => {
        const newStats = { ...prev, all: prev.all - 1 };
        if (oldStatus === "want-to-read") newStats.want--;
        else if (oldStatus === "reading") newStats.reading--;
        else if (oldStatus === "read") newStats.read--;
        if (wasFavorite) newStats.fav--;
        if (wasCustom) newStats.custom--;
        return newStats;
      });

      try { await apiBooks.deleteBook(book.id); } 
      catch (error) { console.error("Помилка:", error); loadStats(); loadBooks(currentPage); }
    }
  };

  const handleNoteUpdate = async (id, noteText) => {
    try {
      const bookToUpdate = books.find((b) => b.id === id);
      const notesArray = bookToUpdate?.book_notes || [];
      const latestNote = notesArray.length > 0 ? notesArray[notesArray.length - 1] : null;

      let savedNote;
      if (latestNote) savedNote = await apiNotesQuotes.updateNote(latestNote.id, { content: noteText });
      else if (noteText.trim()) savedNote = await apiNotesQuotes.addNote(id, noteText);

      setBooks((prevBooks) =>
        prevBooks.map((b) => {
          if (b.id === id) {
            const updatedNotes = [...(b.book_notes || [])];
            if (latestNote) updatedNotes[updatedNotes.length - 1] = savedNote;
            else if (savedNote) updatedNotes.push(savedNote);
            return { ...b, book_notes: updatedNotes };
          }
          return b;
        })
      );
    } catch (error) { console.error("Помилка:", error); alert("Не вдалося зберегти нотатку"); }
  };

  // --- ЛОГІКА ТРАНСФОРМАЦІЇ (ПОШУК -> СОРТУВАННЯ -> ГРУПУВАННЯ) ---
  const { filteredBooks, groupedBooks, searchSuggestions } = useMemo(() => {
    let list = Array.isArray(books) ? [...books] : [];

    let suggestions = [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((b) => 
        b.title?.toLowerCase().includes(q) || 
        b.author?.toLowerCase().includes(q)
      );
      suggestions = list.slice(0, 5);
    }

    list.sort((a, b) => {
      if (currentSort === "rating-desc") return (b.rating || 0) - (a.rating || 0);
      if (currentSort === "rating-asc") return (a.rating || 0) - (b.rating || 0);
      if (currentSort === "year-desc") return (b.year || 0) - (a.year || 0);
      if (currentSort === "year-asc") return (a.year || 0) - (b.year || 0);
      if (currentSort === "progress-desc") return (b.progress || 0) - (a.progress || 0);
      if (currentSort === "added-desc") return new Date(b.addedDate || 0).getTime() - new Date(a.addedDate || 0).getTime();
      if (currentSort === "added-asc") return new Date(a.addedDate || 0).getTime() - new Date(b.addedDate || 0).getTime();
      return 0;
    });

    let grouped = null;
    if (["genre", "author", "year"].includes(currentSort)) {
      grouped = list.reduce((acc, book) => {
        let key = "Інше";
        if (currentSort === "genre") key = book.genre || "Без жанру";
        if (currentSort === "author") key = book.author || "Невідомий автор";
        if (currentSort === "year") key = book.year ? `${book.year} рік` : "Рік не вказано";

        if (!acc[key]) acc[key] = [];
        acc[key].push(book);
        return acc;
      }, {});

      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (currentSort === "year") return b.localeCompare(a); 
        return a.localeCompare(b);
      });

      grouped = sortedKeys.reduce((obj, key) => {
        obj[key] = grouped[key];
        return obj;
      }, {});
    }

    return { filteredBooks: list, groupedBooks: grouped, searchSuggestions: suggestions };
  }, [books, currentSort, searchQuery]);

  const getCurrentSortLabel = () => {
    const allOpts = [...SORT_OPTIONS.groups, ...SORT_OPTIONS.lists];
    const found = allOpts.find(o => o.id === currentSort);
    return found ? found.label : "Сортування";
  };

  // Логіка візуалізації кнопок сторінок (1, 2, 3, 4, 5)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Мої книги</h1>
        <p className="text-muted-foreground">Ваша колекція та прогрес читання</p>
      </header>

      {/* ПАНЕЛЬ УПРАВЛІННЯ */}
      <div className="bg-muted/20 p-6 rounded-3xl border space-y-6">
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: "all", label: "Всі", count: stats.all },
            { id: "reading", label: "Читаю", count: stats.reading },
            { id: "read", label: "Прочитано", count: stats.read },
            { id: "want-to-read", label: "В планах", count: stats.want },
            { id: "favorite", label: "Улюблені", count: stats.fav },
            { id: "custom", label: "Додані мною", count: stats.custom },
          ].map((cat) => (
            <Button
              key={cat.id}
              variant={currentFilter === cat.id ? "default" : "secondary"}
              onClick={() => setCurrentFilter(cat.id)}
              className="rounded-full text-xs"
            >
              {cat.label} 
              <span className="ml-2 opacity-50">{cat.count !== undefined ? cat.count : 0}</span>
            </Button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto items-center">
          {/* Пошук */}
          <div className="relative flex-1 w-full" ref={searchContainerRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук у моїй бібліотеці..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="pl-9 h-11 bg-background"
              />
            </div>
            
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                {searchSuggestions.length > 0 ? (
                  <>
                    {searchSuggestions.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => navigate(`/books/${book.id}`)}
                        className="w-full text-left px-4 py-3 hover:bg-muted text-sm border-b border-border flex items-center gap-3 transition-colors group"
                      >
                        <BookPlus className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100" />
                        <div className="flex-1 truncate">
                          <span className="font-semibold block truncate">{book.title}</span>
                          <span className="text-xs text-muted-foreground truncate">{book.author}</span>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => setIsSearchFocused(false)}
                      className="w-full text-center px-4 py-3 text-sm text-primary hover:bg-primary/5 font-medium transition-colors"
                    >
                      Всі результати по запиту "{searchQuery}" ({filteredBooks.length})
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-4 text-sm text-center text-muted-foreground">
                    Нічого не знайдено
                  </div>
                )}
              </div>
            )}
          </div>

          {/* СОРТУВАННЯ */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-[240px]" ref={sortContainerRef}>
              <Button
                variant="outline"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full h-11 px-4 rounded-xl border bg-background flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ListFilter className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{getCurrentSortLabel()}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} />
              </Button>

              {isSortOpen && (
                <div className="absolute top-full right-0 mt-2 w-full sm:w-[260px] bg-popover border rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 overflow-hidden">
                  <div className="py-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">
                      Групування (Блоки)
                    </div>
                    {SORT_OPTIONS.groups.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setCurrentSort(opt.id); setIsSortOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-muted ${currentSort === opt.id ? "text-primary font-bold bg-primary/5" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <opt.icon className="w-4 h-4" />
                          <span>{opt.label}</span>
                        </div>
                        {currentSort === opt.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                    
                    <div className="px-3 py-2 mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 border-t">
                      Списки
                    </div>
                    {SORT_OPTIONS.lists.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setCurrentSort(opt.id); setIsSortOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-muted ${currentSort === opt.id ? "text-primary font-bold bg-primary/5" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <opt.icon className="w-4 h-4" />
                          <span>{opt.label}</span>
                        </div>
                        {currentSort === opt.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setCurrentFilter("all");
                setCurrentSort("added-desc");
                setSearchQuery("");
                setCurrentPage(1); // Скидаємо на першу сторінку
              }}
              title="Скинути всі налаштування"
              className="h-11 w-11 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200/50"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary/60" />
            <p className="animate-pulse font-medium">Оновлення бібліотеки...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed rounded-[2rem] bg-muted/20 flex flex-col items-center gap-4">
            <div className="p-4 bg-background rounded-full shadow-sm">
              <BookPlus className="w-8 h-8 text-primary/40" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-medium text-muted-foreground">Ваша бібліотека поки що порожня.</p>
              <p className="text-sm text-muted-foreground/80">Додайте першу книгу через пошук, щоб почати!</p>
            </div>
            <Button onClick={() => navigate('/search')} className="mt-4">
              <Search className="w-4 h-4 mr-2"/> Знайти книги
            </Button>
          </div>
        ) : (
          <>
            {groupedBooks ? (
              <div className="space-y-12">
                {Object.entries(groupedBooks).map(([groupName, items]) => (
                  <div key={groupName} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                        {currentSort === 'genre' && <Tag className="w-5 h-5"/>}
                        {currentSort === 'author' && <UserIcon className="w-5 h-5"/>}
                        {currentSort === 'year' && <Calendar className="w-5 h-5"/>}
                        {groupName} ({items.length})
                      </h2>
                      <div className="h-px flex-1 bg-border/60"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {items.map((book) => (
                        <BookCard
                          key={book.id} book={book}
                          onStatusChange={handleStatusChange} onToggleFavorite={handleToggleFavorite}
                          onDelete={handleDelete} onNoteUpdate={handleNoteUpdate}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredBooks.map((book) => (
                    <BookCard
                      key={book.id} book={book}
                      onStatusChange={handleStatusChange} onToggleFavorite={handleToggleFavorite}
                      onDelete={handleDelete} onNoteUpdate={handleNoteUpdate}
                    />
                  ))}
                </div>

                {filteredBooks.length === 0 && (
                  <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dotted mt-6">
                    <p className="text-muted-foreground font-medium text-lg">За вашими критеріями нічого не знайдено 🕵️‍♂️</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* --- ПАНЕЛЬ ПАГІНАЦІЇ --- */}
        {!searchQuery.trim() && totalPages > 1 && (
          <div className="flex flex-col items-center justify-center pt-12 space-y-4">
            
            <div className="flex items-center gap-1.5 bg-card border p-1.5 rounded-2xl shadow-sm">
              <Button
                variant="ghost" size="icon"
                onClick={() => loadBooks(1)} disabled={currentPage === 1 || isLoading}
                className="w-10 h-10 rounded-xl" title="На початок"
              >
                <ChevronsLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                onClick={() => loadBooks(currentPage - 1)} disabled={currentPage === 1 || isLoading}
                className="w-10 h-10 rounded-xl" title="Попередня сторінка"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex items-center px-2 gap-1">
                {getPageNumbers().map(pageNum => (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    onClick={() => loadBooks(pageNum)}
                    disabled={isLoading}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === pageNum ? "shadow-md scale-105" : "text-muted-foreground"}`}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                variant="ghost" size="icon"
                onClick={() => loadBooks(currentPage + 1)} disabled={currentPage === totalPages || isLoading}
                className="w-10 h-10 rounded-xl" title="Наступна сторінка"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                onClick={() => loadBooks(totalPages)} disabled={currentPage === totalPages || isLoading}
                className="w-10 h-10 rounded-xl" title="В кінець"
              >
                <ChevronsRight className="w-5 h-5" />
              </Button>
            </div>
            
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Сторінка {currentPage} з {totalPages}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}