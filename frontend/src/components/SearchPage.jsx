import { useState, useMemo } from "react";
import { 
  Search, PlusCircle, BookOpen, Loader2, 
  BarChart3, Globe, Calendar, Layers, RotateCcw, Tag, Star, 
  
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { apiBooks } from "../api/ApiService";
import { AddBookDialog } from "./AddBookDialog";
import { ImageWithFallback } from "./ui/ImageWithFallback";

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
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const [sortBy, setSortBy] = useState("relevance");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLang, setSelectedLang] = useState("all");
  const [selectedPageRange, setSelectedPageRange] = useState("all");
  const [selectedDecade, setSelectedDecade] = useState("all");

  const availableGenres = useMemo(() => {
    const genres = new Set(results.map(b => b.genre).filter(Boolean));
    return ["all", ...Array.from(genres).sort()];
  }, [results]);

  /**
   * Обробник первинного пошуку.
   */
  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    setStartIndex(0);
    try {
      const data = await apiBooks.searchExternal(query, filter, 0);
      const incoming = data.results || data;
      
      // Видаляємо дублікати навіть у першій пачці
      const uniqueData = Array.from(new Map(incoming.map(item => [item.id, item])).values());
      setResults(uniqueData);
    } catch (error) {
      if (error.response?.status === 503) {
        alert("Сервіс Google Books тимчасово перевантажений. Спробуйте повторити пошук через хвилину або скористайтеся ручним додаванням.");
      } else {
        console.error("Помилка пошуку:", error);
        alert("Сталася помилка при завантаженні результатів.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Нові книги додаються лише якщо їх ID ще немає в списку.
   */
  const handleLoadMore = async () => {
    const nextIndex = startIndex + 20;
    setIsLoading(true);
    try {
      const data = await apiBooks.searchExternal(query, filter, nextIndex);
      const incomingBooks = data.results || data;

      setResults((prev) => {
        // Створюємо Set з уже існуючих ID для швидкої перевірки
        const existingIds = new Set(prev.map(b => b.id));
        // Фільтруємо нові книги, залишаючи лише ті, яких ще немає
        const newUniqueData = incomingBooks.filter(b => !existingIds.has(b.id));
        
        return [...prev, ...newUniqueData];
      });
      
      setStartIndex(nextIndex);
    } catch (error) {
      if (error.response?.status === 503) {
        alert("Не вдалося завантажити більше результатів через обмеження сервісу Google. Будь ласка, зачекайте трохи.");
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

    // Перевіряємо, чи є в обраному полі буквально те слово, що ввів користувач
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      list = list.filter((b) => {
        if (filter === "title") return b.title?.toLowerCase().includes(lowerQuery);
        if (filter === "author") return b.author?.toLowerCase().includes(lowerQuery);
        if (filter === "genre") return b.genre?.toLowerCase().includes(lowerQuery);
        if (filter === "all") {
          // Якщо обрано "Усі поля", перевіряємо основні атрибути
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
      list = list.filter(b => {
        const lang = b.language?.toLowerCase() || 'unknown';
        if (selectedLang === 'uk') return lang === 'uk';
        if (selectedLang === 'en') return lang === 'en';
        return lang !== 'uk' && lang !== 'en';
      });
    }

    if (selectedGenre !== "all") list = list.filter(b => b.genre === selectedGenre);

    if (selectedPageRange !== "all") {
      if (selectedPageRange === "short") list = list.filter(b => b.pages <= 150);
      else if (selectedPageRange === "medium") list = list.filter(b => b.pages > 150 && b.pages <= 400);
      else if (selectedPageRange === "long") list = list.filter(b => b.pages > 400);
    }

    if (selectedDecade !== "all") {
      const year = parseInt(selectedDecade);
      list = list.filter(b => b.year >= year && b.year < year + 10);
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
  }, [results, sortBy, selectedLang, selectedGenre, selectedPageRange, selectedDecade, query, filter]);

  const handleAddGoogleBook = async (book) => {
    if (!confirm(`Додати книгу "${book.title}" до бібліотеки?`)) return;
    try {
      await apiBooks.addBook({
        title: book.title, 
        author: book.author, 
        genre: book.genre,
        year: book.year, 
        totalPages: book.pages, 
        status: "want-to-read",
        cover: book.cover, 
        description: book.description,
        externalRating: book.externalRating, 
        ratingsCount: book.ratingsCount,
        isCustom: false // Ознака, що книга з пошуку
      });
      alert("Додано!");
    } catch (error) {
      console.error("Помилка при додаванні книги:", error);
      alert("Помилка додавання.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-3 max-w-4xl mx-auto">
        <Input 
          placeholder="Назва, автор або жанр..." 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          onKeyDown={(e) => e.key === "Enter" && handleSearch()} 
          className="h-12" 
        />
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
          <Button onClick={handleSearch} disabled={isLoading} className="h-12 px-8">
            {isLoading ? <Loader2 className="animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {results.length > 0 && (
          <aside className="w-full md:w-72 space-y-6 shrink-0">
            <div className="sticky top-20 space-y-6">
              <Button 
                variant="outline" 
                className="w-full py-8 border-dashed border-primary/40 flex flex-col gap-2 hover:bg-primary/5 transition-all"
                onClick={() => setIsManualModalOpen(true)}
              >
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold uppercase">Додати вручну</span>
              </Button>

              <div className="p-5 border rounded-2xl bg-card space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Фільтри</span>
                  <button onClick={resetFilters} className="text-[10px] text-primary hover:underline flex items-center gap-1">
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

                <FilterSection icon={Tag} title="Жанри" current={selectedGenre} onChange={setSelectedGenre} items={availableGenres.map(g => ({ id: g, label: g === 'all' ? 'Всі' : g }))} />
                <FilterSection icon={Globe} title="Мова" current={selectedLang} onChange={setSelectedLang} items={[{ id: 'all', label: 'Всі' }, { id: 'uk', label: 'Українська' }, { id: 'en', label: 'Англійська' }, { id: 'others', label: 'Інші' }]} />
                <FilterSection icon={Layers} title="Обсяг" current={selectedPageRange} onChange={setSelectedPageRange} items={[{ id: 'all', label: 'Всі' }, { id: 'short', label: 'Короткі' }, { id: 'medium', label: 'Середні' }, { id: 'long', label: 'Великі' }]} />
                <FilterSection icon={Calendar} title="Період" current={selectedDecade} onChange={setSelectedDecade} items={[{ id: 'all', label: 'Будь-який' }, { id: '2020', label: '2020-ті' }, { id: '2010', label: '2010-ті' }, { id: '2000', label: '2000-ні' }, { id: '1990', label: '1990-ті' }]} />
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 space-y-8 min-h-[500px]">
          {processedResults.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {processedResults.map((book) => (
                <div key={book.id} className="flex gap-4 p-4 border rounded-xl bg-card hover:shadow-md transition-all group">
                  <div className="w-20 h-28 flex-shrink-0 bg-muted rounded overflow-hidden">
                    <ImageWithFallback src={book.cover} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{book.title}</h3>
                      <p className="text-[11px] text-muted-foreground truncate mt-1 italic">{book.author}</p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        {book.externalRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-[10px] font-bold">{book.externalRating}</span>
                            <span className="text-[9px] text-muted-foreground">({book.ratingsCount})</span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">Немає оцінок</span>
                        )}
                        <span className="text-[9px] bg-secondary/50 px-1.5 py-0.5 rounded uppercase font-bold text-secondary-foreground">{book.language}</span>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="mt-3 w-full h-8 text-xs" onClick={() => handleAddGoogleBook(book)}>
                      <PlusCircle className="h-3 w-3 mr-2" /> Додати
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            hasSearched && !isLoading && <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20 text-muted-foreground">Нічого не знайдено</div>
          )}
          
          {results.length > 0 && (
            <Button variant="secondary" onClick={handleLoadMore} disabled={isLoading} className="w-full h-12 shadow-sm font-semibold">
              {isLoading ? <Loader2 className="animate-spin" /> : "Завантажити ще 20 результатів"}
            </Button>
          )}
        </div>
      </div>
      <AddBookDialog isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} onBookAdded={() => {}} />
    </div>
  );
}