/**
 * @file Сторінка пошуку та додавання книг.
 * @description Реалізує інтерфейс для взаємодії з Google Books API через проксі-сервер бекенда.
 * Забезпечує пошук за різними критеріями (назва, автор, жанр), складну клієнтську фільтрацію
 * отриманих результатів, пагінацію, автодоповнення та можливість ручного додавання книг.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  PlusCircle,
  BookOpen,
  Loader2,
  BarChart3,
  Globe,
  Calendar,
  Layers,
  RotateCcw,
  Tag,
  Star,
  CheckCircle, BookPlus
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { apiBooks } from "../api/ApiService";
import { AddBookDialog } from "../components/AddBookDialog";
import { ImageWithFallback } from "../components/ui/ImageWithFallback";

const FilterSection = ({ icon: Icon, title, items, current, onChange }) => (
  <div className="space-y-3">
    <h3 className="font-bold flex items-center gap-2 border-b pb-2 pt-2 text-sm">
      <Icon className="h-4 w-4 text-primary" /> {title}
    </h3>
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
            current === item.id
              ? "bg-primary text-primary-foreground shadow-md scale-105"
              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [results, setResults] = useState([]);

  // СТАНИ ЗАВАНТАЖЕННЯ ТА МОДАЛЬНИХ ВІКОН
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // СТАНИ АВТОДОПОВНЕННЯ (SUGGESTIONS)
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const [startIndex, setStartIndex] = useState(0);

  const [addedBooks, setAddedBooks] = useState(new Set()); // Зберігає ID доданих книг
  const [bookToConfirm, setBookToConfirm] = useState(null); // Книга, яку хочемо додати (для модалки)
  const [isAddingId, setIsAddingId] = useState(null); // ID книги, яка зараз додається (для лоадера)

  // СТАНИ КЛІЄНТСЬКОЇ ФІЛЬТРАЦІЇ ТА СОРТУВАННЯ
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLang, setSelectedLang] = useState("all");
  const [selectedPageRange, setSelectedPageRange] = useState("all");
  const [selectedDecade, setSelectedDecade] = useState("all");

  const availableGenres = useMemo(() => {
    const genres = new Set(results.map((b) => b.genre).filter(Boolean));
    return ["all", ...Array.from(genres).sort()];
  }, [results]);

  // ЕФЕКТ ДЛЯ АВТОДОПОВНЕННЯ (Debounce пошук)
  useEffect(() => {
    if (query.trim().length < 2 || hasSearched) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await apiBooks.searchExternal(query, filter, 0);
        const incoming = data.results || data;
        
        const uniqueTitles = Array.from(
          new Set(incoming.map((b) => b.title))
        ).filter(Boolean).slice(0, 5);
        
        setSuggestions(uniqueTitles);
        setIsSuggestionsOpen(uniqueTitles.length > 0);
      } catch (error) {
        console.error("Помилка завантаження підказок:", error);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, filter, hasSearched]);

  // ЕФЕКТ ДЛЯ ЗАКРИТТЯ ПІДКАЗОК ПРИ КЛІКУ ПОЗА ЕЛЕМЕНТОМ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery = query) => {
    const finalQuery = typeof searchQuery === 'string' ? searchQuery : query;
    if (!finalQuery.trim()) return;
    
    setIsSuggestionsOpen(false);
    setIsLoading(true);
    setHasSearched(true);
    setStartIndex(0);
    
    try {
      const data = await apiBooks.searchExternal(finalQuery, filter, 0);
      const incoming = data.results || data;

      const uniqueData = Array.from(
        new Map(incoming.map((item) => [item.id, item])).values(),
      );
      setResults(uniqueData);
    } catch (error) {
      if (error.response?.status === 503) {
        alert(
          "Сервіс Google Books тимчасово перевантажений. Спробуйте повторити пошук через хвилину або скористайтеся ручним додаванням.",
        );
      } else {
        console.error("Помилка пошуку:", error);
        alert("Сталася помилка при завантаженні результатів.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleLoadMore = async () => {
    const nextIndex = startIndex + 20;
    setIsLoading(true);
    try {
      const data = await apiBooks.searchExternal(query, filter, nextIndex);
      const incomingBooks = data.results || data;

      setResults((prev) => {
        const existingIds = new Set(prev.map((b) => b.id));
        const newUniqueData = incomingBooks.filter(
          (b) => !existingIds.has(b.id),
        );
        return [...prev, ...newUniqueData];
      });

      setStartIndex(nextIndex);
    } catch (error) {
      if (error.response?.status === 503) {
        alert(
          "Не вдалося завантажити більше результатів через обмеження сервісу Google. Будь ласка, зачекайте трохи.",
        );
      } else {
        console.error("Помилка пагінації:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setSortBy("relevance");
    setSelectedGenre("all");
    setSelectedLang("all");
    setSelectedPageRange("all");
    setSelectedDecade("all");
  };

  const processedResults = useMemo(() => {
    let list = [...results];

    if (query.trim() && hasSearched) {
      const lowerQuery = query.toLowerCase();
      list = list.filter((b) => {
        if (filter === "title") return b.title?.toLowerCase().includes(lowerQuery);
        if (filter === "author") return b.author?.toLowerCase().includes(lowerQuery);
        if (filter === "genre") return b.genre?.toLowerCase().includes(lowerQuery);
        if (filter === "all") {
          return (
            b.title?.toLowerCase().includes(lowerQuery) ||
            b.author?.toLowerCase().includes(lowerQuery) ||
            b.genre?.toLowerCase().includes(lowerQuery) ||
            b.description?.toLowerCase().includes(lowerQuery)
          );
        }
        return true;
      });
    }

    if (selectedLang !== "all") {
      list = list.filter((b) => {
        const lang = b.language?.toLowerCase() || "unknown";
        if (selectedLang === "uk") return lang === "uk";
        if (selectedLang === "en") return lang === "en";
        return lang !== "uk" && lang !== "en";
      });
    }

    if (selectedGenre !== "all") list = list.filter((b) => b.genre === selectedGenre);

    if (selectedPageRange !== "all") {
      if (selectedPageRange === "short") list = list.filter((b) => b.pages <= 150);
      else if (selectedPageRange === "medium") list = list.filter((b) => b.pages > 150 && b.pages <= 400);
      else if (selectedPageRange === "long") list = list.filter((b) => b.pages > 400);
    }

    if (selectedDecade !== "all") {
      const year = parseInt(selectedDecade);
      list = list.filter((b) => b.year >= year && b.year < year + 10);
    }

    switch (sortBy) {
      case "title-asc": list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "title-desc": list.sort((a, b) => b.title.localeCompare(a.title)); break;
      case "author-asc": list.sort((a, b) => (a.author || "").localeCompare(b.author || "")); break;
      case "author-desc": list.sort((a, b) => (b.author || "").localeCompare(a.author || "")); break;
      case "newest": list.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
      case "oldest": list.sort((a, b) => (a.year || 0) - (b.year || 0)); break;
      case "pages-desc": list.sort((a, b) => (b.pages || 0) - (a.pages || 0)); break;
      case "pages-asc": list.sort((a, b) => (a.pages || 0) - (b.pages || 0)); break;
      default: break;
    }

    return list;
  }, [
    results,
    sortBy,
    selectedLang,
    selectedGenre,
    selectedPageRange,
    selectedDecade,
    query,
    filter,
    hasSearched
  ]);

  // Відкриває красиве модальне вікно замість системного confirm
  const handleAddClick = (book) => {
    setBookToConfirm(book);
  };

  // Виконує додавання після підтвердження у модалці
  const confirmAddBook = async () => {
    if (!bookToConfirm) return;
    
    setIsAddingId(bookToConfirm.id);
    try {
      await apiBooks.addBook({
        title: bookToConfirm.title, 
        author: bookToConfirm.author, 
        genre: bookToConfirm.genre,
        year: bookToConfirm.year, 
        totalPages: bookToConfirm.pages, 
        status: "want-to-read",
        cover: bookToConfirm.cover, 
        description: bookToConfirm.description,
        externalRating: bookToConfirm.externalRating, 
        ratingsCount: bookToConfirm.ratingsCount,
        isCustom: false 
      });
      
      // Записуємо ID книги в Set, щоб змінити кнопку на "Додано"
      setAddedBooks(prev => new Set(prev).add(bookToConfirm.id));
      
      // Закриваємо модалку
      setBookToConfirm(null); 
    } catch (error) {
      console.error("Помилка при додаванні книги:", error);
      alert("Не вдалося додати книгу. Спробуйте пізніше.");
    } finally {
      setIsAddingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* РЯДОК ПОШУКУ */}
      <div 
        ref={searchContainerRef}
        className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-3 max-w-4xl mx-auto relative z-20"
      >
        <div className="relative flex-1">
          <Input
            placeholder="Назва, автор або жанр..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHasSearched(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-12 w-full"
          />
          
          {/* ВИПАДАЮЧИЙ СПИСОК ПІДКАЗОК */}
          {isSuggestionsOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-muted text-sm border-b last:border-0 flex items-center gap-3 transition-colors"
                >
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <select
            className="h-12 px-3 rounded-md border text-sm bg-background outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Усі поля</option>
            <option value="title">Назва</option>
            <option value="author">Автор</option>
            <option value="genre">Жанр</option>
          </select>
          <Button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="h-12 px-8"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* ЗАПРОШЕННЯ (ПОЧАТКОВИЙ СТАН) */}
      {!hasSearched && !isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-8 pb-12 text-center space-y-6 animate-in fade-in duration-500">
          <div className="bg-primary/5 p-6 rounded-full">
            <BookOpen className="w-12 h-12 text-primary/60" />
          </div>
          <div className="max-w-md space-y-2 px-4">
            <h2 className="text-xl font-bold">Шукайте нові книги</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Введіть запит у поле вище, щоб знайти книги у глобальній базі даних. Якщо ви не знайшли потрібну книгу або маєте власне видання, ви завжди можете додати її самостійно.
            </p>
          </div>
          
          <div className="flex items-center w-full max-w-xs opacity-40 py-2">
            <div className="flex-grow border-t border-foreground"></div>
            <span className="mx-4 text-xs font-bold uppercase tracking-widest">Або</span>
            <div className="flex-grow border-t border-foreground"></div>
          </div>

          <Button 
            onClick={() => setIsManualModalOpen(true)} 
            variant="outline" 
            className="h-11 px-6 rounded-xl border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 transition-all gap-2"
          >
            <PlusCircle className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Додати книгу вручну</span>
          </Button>
        </div>
      )}

      {/* РЕЗУЛЬТАТИ ТА БІЧНА ПАНЕЛЬ */}
      {(results.length > 0 || (hasSearched && processedResults.length === 0)) && (
        <div className="flex flex-col md:flex-row gap-8">
          {results.length > 0 && (
            <aside className="w-full md:w-72 space-y-6 shrink-0 z-10">
              <div className="sticky top-20 space-y-6">
                <Button
                  variant="outline"
                  className="w-full py-8 border-dashed border-primary/40 flex flex-col gap-2 hover:bg-primary/5 transition-all"
                  onClick={() => setIsManualModalOpen(true)}
                >
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold uppercase">
                    Додати вручну
                  </span>
                </Button>

                <div className="p-5 border rounded-2xl bg-card space-y-6 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                      Фільтри
                    </span>
                    <button
                      onClick={resetFilters}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" /> Скинути
                    </button>
                  </div>

                  <FilterSection
                    icon={BarChart3}
                    title="Сортування"
                    current={sortBy}
                    onChange={setSortBy}
                    items={[
                      { id: "relevance", label: "За релевантністю" },
                      { id: "title-asc", label: "Назва (А-Я)" },
                      { id: "title-desc", label: "Назва (Я-А)" },
                      { id: "author-asc", label: "Автор (А-Я)" },
                      { id: "author-desc", label: "Автор (Я-А)" },
                      { id: "newest", label: "Найновіші" },
                      { id: "oldest", label: "Найстаріші" },
                      { id: "pages-desc", label: "Найбільше сторінок" },
                      { id: "pages-asc", label: "Найменше сторінок" },
                    ]}
                  />

                  <FilterSection
                    icon={Tag}
                    title="Жанри"
                    current={selectedGenre}
                    onChange={setSelectedGenre}
                    items={availableGenres.map((g) => ({
                      id: g,
                      label: g === "all" ? "Всі" : g,
                    }))}
                  />
                  <FilterSection
                    icon={Globe}
                    title="Мова"
                    current={selectedLang}
                    onChange={setSelectedLang}
                    items={[
                      { id: "all", label: "Всі" },
                      { id: "uk", label: "Українська" },
                      { id: "en", label: "Англійська" },
                      { id: "others", label: "Інші" },
                    ]}
                  />
                  <FilterSection
                    icon={Layers}
                    title="Обсяг"
                    current={selectedPageRange}
                    onChange={setSelectedPageRange}
                    items={[
                      { id: "all", label: "Всі" },
                      { id: "short", label: "Короткі" },
                      { id: "medium", label: "Середні" },
                      { id: "long", label: "Великі" },
                    ]}
                  />
                  <FilterSection
                    icon={Calendar}
                    title="Період"
                    current={selectedDecade}
                    onChange={setSelectedDecade}
                    items={[
                      { id: "all", label: "Будь-який" },
                      { id: "2020", label: "2020-ті" },
                      { id: "2010", label: "2010-ті" },
                      { id: "2000", label: "2000-ні" },
                      { id: "1990", label: "1990-ті" },
                    ]}
                  />
                </div>
              </div>
            </aside>
          )}

          <div className="flex-1 space-y-8 min-h-[500px]">
            {processedResults.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {processedResults.map((book) => (
                  <div
                    key={book.id}
                    className="flex gap-4 p-4 border rounded-xl bg-card hover:shadow-md transition-all group"
                  >
                    <div className="w-20 h-28 flex-shrink-0 bg-muted rounded overflow-hidden">
                      <ImageWithFallback
                        src={book.cover}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground truncate mt-1 italic">
                          {book.author}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          {book.externalRating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              <span className="text-[10px] font-bold">
                                {book.externalRating}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                ({book.ratingsCount})
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-muted-foreground">
                              Немає оцінок
                            </span>
                          )}
                          <span className="text-[9px] bg-secondary/50 px-1.5 py-0.5 rounded uppercase font-bold text-secondary-foreground">
                            {book.language}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const isAdded = addedBooks.has(book.id);
                        const isAdding = isAddingId === book.id;

                        return (
                          <Button 
                            variant={isAdded ? "secondary" : "outline"} 
                            size="sm" 
                            className={`mt-3 w-full h-8 text-xs transition-all duration-300 ${
                              isAdded ? "text-green-600 bg-green-50 border-green-200 pointer-events-none" : ""
                            }`} 
                            onClick={() => handleAddClick(book)}
                            disabled={isAdded || isAdding}
                          >
                            {isAdding ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : 
                            isAdded ? <CheckCircle className="h-3 w-3 mr-2 text-green-500" /> : 
                            <PlusCircle className="h-3 w-3 mr-2" />}
                            {isAdded ? "Додано" : "Додати"}
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              hasSearched &&
              !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-3xl bg-muted/20 text-center space-y-5 animate-in fade-in">
                  <div className="bg-background p-4 rounded-full shadow-sm mb-2">
                    <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">За вашим запитом нічого не знайдено</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Спробуйте змінити критерії пошуку або додайте книгу самостійно, якщо її немає у глобальній базі.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsManualModalOpen(true)}
                    variant="default"
                    className="gap-2 mt-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Додати вручну
                  </Button>
                </div>
              )
            )}

            {results.length > 0 && (
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="w-full h-12 shadow-sm font-semibold"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Завантажити ще 20 результатів"
                )}
              </Button>
            )}
          </div>
        </div>
      )}
      
      <AddBookDialog
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onBookAdded={() => {}}
      />

      {/* --- КРАСИВЕ МОДАЛЬНЕ ВІКНО ПІДТВЕРДЖЕННЯ --- */}
      {bookToConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-2">
                <BookPlus size={32} />
              </div>
              
              <h2 className="text-xl font-black text-foreground">Додати до бібліотеки?</h2>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ви збираєтесь додати книгу <br/>
                <strong className="text-foreground">«{bookToConfirm.title}»</strong> <br/>
                до вашого списку "В планах".
              </p>

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  className="w-full h-11 rounded-xl font-bold gap-2 shadow-md"
                  onClick={confirmAddBook}
                  disabled={isAddingId !== null}
                >
                  {isAddingId !== null ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                  Додати книгу
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full h-11 rounded-xl font-medium"
                  onClick={() => setBookToConfirm(null)}
                  disabled={isAddingId !== null}
                >
                  Скасувати
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}