import { useState } from "react";
import { Search, PlusCircle, BookOpen, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { apiBooks } from "../api/ApiService";
import { AddBookDialog } from "./AddBookDialog";
import { ImageWithFallback } from "./ui/ImageWithFallback";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setResults([]);

    try {
      const data = await apiBooks.searchExternal(query, filter);
      setResults(data);
    } catch (error) {
      console.error("Помилка пошуку:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      });
      alert("Книгу успішно додано!");
    } catch (error) {
      console.error("Помилка додавання:", error);
      alert("Помилка при додаванні книги.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">Пошук книг</h1>
        <p className="text-muted-foreground">
          Знайдіть нові книги через Google Books або додайте їх вручну
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <Input
            placeholder="Введіть пошуковий запит..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-4 h-12"
          />
        </div>

        <div className="flex gap-2">
          <select
            className="h-12 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Усі поля</option>
            <option value="title">Назва</option>
            <option value="author">Автор</option>
            <option value="genre">Жанр</option>
          </select>

          <Button
            onClick={handleSearch}
            className="h-12 px-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Знайти
          </Button>
        </div>
      </div>

      <div className="min-h-[300px]">
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((book) => (
              <div
                key={book.id}
                className="flex gap-4 p-4 border rounded-xl bg-card hover:shadow-md transition-shadow"
              >
                <div className="w-20 h-28 flex-shrink-0 bg-muted rounded overflow-hidden">
                  <ImageWithFallback
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <h3
                      className="font-medium line-clamp-2 text-sm md:text-base"
                      title={book.title}
                    >
                      {book.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                      {book.author}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {book.year} • {book.pages} стор.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => handleAddGoogleBook(book)}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Додати
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasSearched && results.length === 0 && !isLoading && (
          <div className="text-center py-12 space-y-4">
            <p className="text-lg text-muted-foreground">
              За запитом "{query}" нічого не знайдено
            </p>
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Бажаєте додати книгу самостійно?
              </span>
              <Button
                variant="outline"
                onClick={() => setIsManualModalOpen(true)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Додати книгу вручну
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddBookDialog
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onBookAdded={() => {
          alert("Книгу додано вручну!");
          setIsManualModalOpen(false);
        }}
      />
    </div>
  );
}
