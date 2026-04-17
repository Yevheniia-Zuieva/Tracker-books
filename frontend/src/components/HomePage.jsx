/**
 * @file Головна сторінка додатку (Бібліотека користувача).
 * Відповідає за завантаження, фільтрацію, сортування та відображення списку книг.
 */
import { useState, useEffect, useMemo } from "react";
import { BookCard } from "./BookCard";
import { apiBooks } from "../api/ApiService";
import { Loader2, RotateCcw, ChevronUp, ChevronDown, Star, Tag, BookPlus } from "lucide-react";
import { Button } from "./ui/button";

function HomePage() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentFilter, setCurrentFilter] = useState("all"); 
  const [currentSort, setCurrentSort] = useState(null); 

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const data = await apiBooks.getAllBooks();
      setBooks(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Помилка завантаження:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ОБРОБНИКИ ПОДІЙ ---
  const handleStatusChange = async (id, nextStatus) => {
    try {
      setBooks(prev => prev.map(b => b.id === id ? { ...b, status: nextStatus } : b));
      await apiBooks.updateBook(id, { status: nextStatus });
    } catch (error) {
      console.error("Помилка зміни статусу:", error);
      loadBooks();
    }
  };

  const handleToggleFavorite = async (id) => {
    const book = books.find(b => b.id === id);
    if (!book) return;
    try {
      const newFav = !book.isFavorite;
      setBooks(prev => prev.map(b => b.id === id ? { ...b, isFavorite: newFav } : b));
      await apiBooks.updateBook(id, { isFavorite: newFav });
    } catch (error) {
      console.error("Помилка улюбленого:", error);
      loadBooks();
    }
  };

  const handleDelete = async (book) => {
    if (window.confirm(`Видалити "${book.title}"?`)) {
      try {
        await apiBooks.deleteBook(book.id);
        setBooks(prev => prev.filter(b => b.id !== book.id));
      } catch (error) {
        console.error("Помилка видалення:", error);
      }
    }
  };

  const handleNoteUpdate = async (id, note) => {
    try {
      setBooks(prev => prev.map(b => b.id === id ? { ...b, note } : b));
      await apiBooks.updateBook(id, { note });
    } catch (error) {
      console.error("Помилка нотатки:", error);
    }
  };

  // --- ЛОГІКА ТРАНСФОРМАЦІЇ ---
  const { filteredBooks, groupedBooks } = useMemo(() => {
    let list = [...books];

    if (currentFilter !== "all") {
      list = currentFilter === "favorite" 
        ? list.filter(b => b.isFavorite) 
        : list.filter(b => b.status === currentFilter);
    }

    if (currentSort === "rating-desc") {
      list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (currentSort === "rating-asc") {
      list.sort((a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));
    }

    let grouped = null;
    if (currentSort === "genre") {
      grouped = list.reduce((acc, book) => {
        const genre = book.genre || "Без жанру";
        if (!acc[genre]) acc[genre] = [];
        acc[genre].push(book);
        return acc;
      }, {});
      grouped = Object.fromEntries(Object.entries(grouped).sort());
    }

    return { filteredBooks: list, groupedBooks: grouped };
  }, [books, currentFilter, currentSort]);

  const counts = {
    all: books.length,
    reading: books.filter(b => b.status === "reading").length,
    read: books.filter(b => b.status === "read").length,
    want: books.filter(b => b.status === "want-to-read").length,
    fav: books.filter(b => b.isFavorite).length,
  };

  // --- ВІЗУАЛ ЗАВАНТАЖЕННЯ ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary/60" />
        <p className="animate-pulse font-medium text-lg">Завантаження вашої бібліотеки...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary tracking-tight">
          Мої книги
        </h1>
        <p className="text-muted-foreground">
          Ваша колекція та прогрес читання
        </p>
      </header>

      {/* ПАНЕЛЬ ФІЛЬТРІВ (категорії та сортування) */}
      <div className="space-y-4 bg-muted/20 p-6 rounded-3xl border">
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: "all", label: "Всі", count: counts.all },
            { id: "reading", label: "Читаю", count: counts.reading },
            { id: "read", label: "Прочитано", count: counts.read },
            { id: "want-to-read", label: "В планах", count: counts.want },
            { id: "favorite", label: "Улюблені", count: counts.fav }
          ].map(cat => (
            <Button
              key={cat.id}
              variant={currentFilter === cat.id ? "default" : "secondary"}
              onClick={() => setCurrentFilter(cat.id)}
              className="rounded-full text-xs"
            >
              {cat.label} <span className="ml-2 opacity-50">{cat.count}</span>
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 pt-4 border-t border-border/50">
          <Button
            variant={currentSort === "genre" ? "secondary" : "outline"}
            onClick={() => setCurrentSort(currentSort === "genre" ? null : "genre")}
            className="h-8 text-[10px]"
          >
            <Tag className="w-3 h-3 mr-2" /> За жанром
          </Button>

          <Button
            variant={currentSort?.startsWith("rating") ? "secondary" : "outline"}
            onClick={() => setCurrentSort(prev => prev === "rating-desc" ? "rating-asc" : "rating-desc")}
            className="h-8 text-[10px] gap-2"
          >
            <Star className="w-3 h-3" /> За рейтингом 
            {currentSort === "rating-asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>

          <Button
            variant="ghost"
            onClick={() => { setCurrentFilter("all"); setCurrentSort(null); }}
            className="text-[10px] text-red-500 hover:bg-red-50"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Скинути
          </Button>
        </div>
      </div>

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <div className="min-h-[400px]">
        {/* Якщо в базі взагалі немає жодної книги */}
        {books.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed rounded-[2rem] bg-muted/20 flex flex-col items-center gap-4">
            <div className="p-4 bg-background rounded-full shadow-sm">
              <BookPlus className="w-8 h-8 text-primary/40" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-medium text-muted-foreground">Ваша бібліотека поки що порожня.</p>
              <p className="text-sm text-muted-foreground/80">Додайте першу книгу через пошук, щоб почати!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Режим сортування за Жанрами */}
            {currentSort === "genre" && groupedBooks ? (
              <div className="space-y-12">
                {Object.entries(groupedBooks).map(([genre, items]) => (
                  <div key={genre} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold text-primary">{genre} ({items.length})</h2>
                      <div className="h-px flex-1 bg-border/60"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {items.map(book => (
                        <BookCard 
                          key={book.id} 
                          book={book}  
                          onStatusChange={handleStatusChange} 
                          onToggleFavorite={handleToggleFavorite} 
                          onDelete={handleDelete} 
                          onNoteUpdate={handleNoteUpdate} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Звичайна сітка (з перевіркою на пусту категорію) */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredBooks.map(book => (
                    <BookCard 
                      key={book.id} 
                      book={book} 
                      onStatusChange={handleStatusChange} 
                      onToggleFavorite={handleToggleFavorite} 
                      onDelete={handleDelete} 
                      onNoteUpdate={handleNoteUpdate} 
                    />
                  ))}
                </div>

                {/* Якщо книги в базі є, але під поточний фільтр нічого не підпало */}
                {filteredBooks.length === 0 && (
                  <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dotted">
                    <p className="text-muted-foreground font-medium">
                      У категорії "{currentFilter === 'favorite' ? 'Улюблені' : currentFilter}" поки немає книг.
                    </p>
                    <p className="text-sm text-muted-foreground/60 mt-2">
                      Спробуйте змінити фільтр або позначити книги іншим статусом.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;