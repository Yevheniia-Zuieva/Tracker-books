/**
 * @file Головна сторінка додатку (Бібліотека користувача).
 * Відповідає за завантаження, фільтрацію, сортування та відображення списку книг.
 */
import { useState, useEffect } from "react";
import { CategoryTabs } from "./CategoryTabs";
import { BookCard } from "./BookCard";
import { apiBooks } from "../api/ApiService";
import { Loader2 } from "lucide-react";

/**
 * Компонент домашньої сторінки, що відображає бібліотеку книг користувача.
 *
 * @param {Object} props - Властивості компонента.
 * @param {Function} props.onBookClick - Функція зворотного виклику, що спрацьовує при кліку на картку книги.
 * @returns {JSX.Element} React-компонент головної сторінки.
 */
export function HomePage({ onBookClick }) {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("home");

  // Завантаження книг при старті
  useEffect(() => {
    loadBooks();
  }, []);

  /**
   * Асинхронно завантажує список книг користувача з сервера.
   * @async
   */
  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const data = await apiBooks.getAllBooks();
      setBooks(data);
    } catch (error) {
      console.error("Не вдалося завантажити книги:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Обробник збереження нотатки до книги.
   * Оновлює стан локально для миттєвого відображення та відправляє запит на сервер.
   * * @async
   * @param {number|string} bookId - Унікальний ідентифікатор книги.
   * @param {string} note - Новий текст нотатки.
   */
  const handleNoteUpdate = async (bookId, note) => {
    try {
      // Оптимістичне оновлення (миттєво на екрані)
      setBooks((prevBooks) =>
        prevBooks.map((b) => (b.id === bookId ? { ...b, note } : b)),
      );

      // Запит на сервер
      await apiBooks.updateBook(bookId, { note });
    } catch (error) {
      console.error("Помилка збереження нотатки:", error);
      alert("Не вдалося зберегти нотатку");
    }
  };

  /**
   * Фільтрує та сортує масив книг залежно від обраної категорії (вкладки).
   * * @returns {Array} Відфільтрований та відсортований масив книг.
   */
  const getFilteredBooks = () => {
    const filtered = [...books];

    switch (activeCategory) {
      case "reading":
        return filtered.filter((b) => b.status === "reading");
      case "read":
        return filtered.filter((b) => b.status === "read");
      case "want-to-read":
        return filtered.filter((b) => b.status === "want-to-read");
      case "favorite":
        return filtered.filter((b) => b.status === "favorite");
      case "by-rating":
        return filtered
          .filter((b) => b.rating !== undefined && b.rating > 0)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "by-genre":
        return filtered.sort((a, b) => a.genre.localeCompare(b.genre));
      case "all":
      default:
        return filtered;
    }
  };

  /**
   * Підраховує кількість книг у кожній категорії для відображення на вкладках (бейджах).
   * * @returns {Object} Об'єкт, де ключі — це назви категорій, а значення — кількість книг.
   */
  const getBookCounts = () => {
    return {
      all: books.length,
      reading: books.filter((b) => b.status === "reading").length,
      read: books.filter((b) => b.status === "read").length,
      "want-to-read": books.filter((b) => b.status === "want-to-read").length,
      favorite: books.filter((b) => b.status === "favorite").length,
      "by-genre": books.length,
      "by-rating": books.filter((b) => b.rating).length,
    };
  };

  const filteredBooks = getFilteredBooks();
  const bookCounts = getBookCounts();

  /**
   * Спеціальна функція для рендерингу книг, згрупованих за жанрами.
   * * @returns {JSX.Element} Розмітка з категоріями жанрів та сітками книг.
   */
  const renderBooksByGenre = () => {
    const genres = [...new Set(books.map((b) => b.genre))]
      .filter(Boolean)
      .sort();

    return (
      <div className="space-y-8">
        {genres.map((genre) => {
          const genreBooks = books.filter((b) => b.genre === genre);
          return (
            <div key={genre}>
              <h3 className="text-lg font-medium mb-4 text-primary border-b pb-2 inline-block">
                {genre}
                <span className="ml-2 text-muted-foreground text-sm font-normal">
                  ({genreBooks.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {genreBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onBookClick={onBookClick}
                    onNoteUpdate={handleNoteUpdate}
                    compact
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p>Завантаження вашої бібліотеки...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Мої книги
          </h1>
          <p className="text-muted-foreground mt-1">
            Ваша колекція та прогрес читання
          </p>
        </div>
      </div>

      {/* Категорії */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        bookCounts={bookCounts}
      />

      {/* Список книг */}
      <div className="min-h-[400px]">
        {books.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
            <p className="text-lg text-muted-foreground">
              Ваша бібліотека поки що порожня.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Додайте першу книгу, щоб почати!
            </p>
          </div>
        ) : activeCategory === "by-genre" ? (
          renderBooksByGenre()
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onBookClick={onBookClick}
                  onNoteUpdate={handleNoteUpdate}
                />
              ))}
            </div>

            {filteredBooks.length === 0 && (
              <div className="text-center py-12 mt-8">
                <p className="text-muted-foreground">
                  У цій категорії немає книг.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
