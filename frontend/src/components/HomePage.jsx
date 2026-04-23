/**
 * @file Головна сторінка застосунку "Tracker Books" (Персональна бібліотека).
 * @description Центральний компонент для менеджменту книг користувача.
 * Реалізує асинхронне завантаження даних, фільтрацію за статусами,
 * складне сортування (за жанрами, рейтингом) та пагінацію результатів.
 * Включає логіку "оптимістичного UI" для миттєвого відгуку інтерфейсу при зміні станів.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { BookCard } from "./BookCard";
import { apiBooks, apiNotesQuotes } from "../api/ApiService";
import {
  Loader2,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Star,
  Tag,
  BookPlus,
} from "lucide-react";
import { Button } from "./ui/button";

/**
 * Компонент HomePage.
 * * Виконує функціональні вимоги:
 * - Відображення та організація бібліотеки.
 * - Візуалізація агрегованої статистики.
 * * @component
 * @returns {React.JSX.Element} Головна сторінка з фільтрами та сіткою книг.
 */
function HomePage() {
  /**
   * Масив об'єктів книг поточної сторінки
   * @type {Array}
   */
  const [books, setBooks] = useState([]);

  /**
   * Стан первинного завантаження бібліотеки
   * @type {boolean}
   */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Об'єкт лічильників для бейджів категорій
   * @type {Object}
   */
  const [stats, setStats] = useState({
    all: 0,
    reading: 0,
    read: 0,
    want: 0,
    fav: 0,
  });

  /**
   * Стан завантаження додаткової порції даних (Infinity Scroll/Load More)
   * @type {boolean}
   */
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  /**
   * Поточний активний фільтр (all|reading|read|want-to-read|favorite)
   * @type {string}
   */
  const [currentFilter, setCurrentFilter] = useState("all");

  /**
   * Поточний метод сортування (genre|rating-asc|rating-desc)
   * @type {string|null}
   */
  const [currentSort, setCurrentSort] = useState(null);

  /**
   * Посилання на наступну сторінку результатів від API
   * @type {string|null}
   */
  const [nextPageUrl, setNextPageUrl] = useState(null);

  /**
   * Отримання статистичних даних бібліотеки з сервера.
   * Виконує мапінг серверних ключів у формат, зрозумілий фронтенду.
   * @async
   * @callback
   */
  const loadStats = useCallback(async () => {
    try {
      const data = await apiBooks.getStats();
      console.log("Статистика від сервера:", data);

      // Перетворення ключів сервера у ключі фронтенду
      setStats({
        all: data.totalBooks || data.all || 0,
        read: data.readCount || data.read || 0,
        reading: data.reading || 0,
        want: data.want || 0,
        fav: data.fav || 0,
      });
    } catch (error) {
      console.error("Помилка статистики:", error);
    }
  }, []);

  /**
   * Основна функція завантаження списку книг.
   * Підтримує пагінацію (через url) та застосування фільтрів/сортування (через params).
   * @async
   * @param {string|null} [url=null] - URL наступної сторінки для дозавантаження.
   * @param {boolean} [isNewFilter=false] - Прапорець, що вказує на зміну критеріїв пошуку.
   * @callback
   */
  const loadBooks = useCallback(
    async (url = null, isNewFilter = false) => {
      try {
        if (isNewFilter) {
          setIsLoading(true);
        } else {
          if (url) {
            setIsMoreLoading(true);
          } else {
            setIsLoading(true);
          }
        }

        // Підготовка параметрів для сервера
        const params = {};
        if (currentFilter === "favorite") {
          params.isFavorite = "true";
        } else if (currentFilter !== "all") {
          params.status = currentFilter;
        }

        if (currentSort) {
          params.sort = currentSort; // Передача ключа сортування
        }

        const data = await apiBooks.getAllBooks(url, params);
        const fetchedResults =
          data.results || (Array.isArray(data) ? data : []);

        setBooks((prev) => {
          // Якщо це новий фільтр — заміна списку. Якщо "завантажити ще" — додавання.
          return url && !isNewFilter
            ? [...prev, ...fetchedResults]
            : fetchedResults;
        });

        setNextPageUrl(data.next || null);
      } catch (error) {
        console.error("Помилка:", error);
      } finally {
        setIsLoading(false);
        setIsMoreLoading(false);
      }
    },
    [currentFilter, currentSort],
  );

  /** Ефект ініціалізації та реагування на зміну фільтрів/сортування */
  useEffect(() => {
    loadBooks(null, true);
    loadStats();
  }, [loadBooks, loadStats]);

  /**
   * Обробник зміни статусу книги з оптимістичним оновленням.
   * Миттєво змінює UI та лічильники, не чекаючи відповіді сервера.
   * @async
   * @param {number} id - ID книги.
   * @param {string} nextStatus - Новий статус ('reading', 'read' тощо).
   */
  const handleStatusChange = async (id, nextStatus) => {
    const book = books.find((b) => b.id === id);
    const oldStatus = book?.status;

    // Оптимістичне оновлення масиву книг
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: nextStatus } : b)),
    );

    // Оптимістичне оновлення лічильників
    setStats((prev) => {
      const newStats = { ...prev };
      // Зменшуємо лічильник старого статусу
      if (oldStatus === "want-to-read") newStats.want--;
      else if (oldStatus === "reading") newStats.reading--;
      else if (oldStatus === "read") newStats.read--;

      // Збільшення лічильнику нового статусу
      if (nextStatus === "want-to-read") newStats.want++;
      else if (nextStatus === "reading") newStats.reading++;
      else if (nextStatus === "read") newStats.read++;

      return newStats;
    });

    try {
      await apiBooks.updateBook(id, { status: nextStatus });
    } catch (error) {
      console.error("Помилка зміни статусу:", error);
      loadStats(); // Відкат до точних даних у разі помилки
    }
  };

  const counts = {
    all: stats.all,
    reading: stats.reading,
    read: stats.read,
    want: stats.want,
    fav: stats.fav,
  };

  /**
   * Оптимістичне перемикання статусу "Обране".
   * @async
   * @param {number} id - ID книги.
   */
  const handleToggleFavorite = async (id) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;

    const newFavState = !book.isFavorite;

    // Оновлення списку книг (щоб серце зафарбувалось миттєво)
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isFavorite: newFavState } : b)),
    );

    // Оновлення лічильника "Улюблені"
    setStats((prev) => ({
      ...prev,
      fav: newFavState ? prev.fav + 1 : prev.fav - 1,
    }));

    try {
      await apiBooks.updateBook(id, { isFavorite: newFavState });
    } catch (error) {
      console.error("Помилка улюбленого:", error);
      // У разі помилки на сервері — повернення точних цифр
      loadStats();
    }
  };

  /**
   * Видалення книги з бібліотеки.
   * Містить логіку підтвердження дії та синхронізації лічильників.
   * @async
   * @param {Object} book - Об'єкт книги для видалення.
   */
  const handleDelete = async (book) => {
    if (window.confirm(`Видалити "${book.title}"?`)) {
      // Збереження даних для відкату лічильників у разі помилки
      const oldStatus = book.status;
      const wasFavorite = book.isFavorite;

      // Оновлення UI (видалення з масиву)
      setBooks((prev) => prev.filter((b) => b.id !== book.id));

      // Оновлення лічильників
      setStats((prev) => {
        const newStats = { ...prev, all: prev.all - 1 };

        if (oldStatus === "want-to-read") newStats.want--;
        else if (oldStatus === "reading") newStats.reading--;
        else if (oldStatus === "read") newStats.read--;

        if (wasFavorite) newStats.fav--;

        return newStats;
      });

      try {
        await apiBooks.deleteBook(book.id);
      } catch (error) {
        console.error("Помилка видалення:", error);
        loadStats(); // Відкат до точних даних у разі помилки
        loadBooks(); // Повернення книги в список
      }
    }
  };

  /**
   * Зберігає або оновлює особисту нотатку до конкретної книги.
   * * Функція перевіряє поточний стан книги: якщо в архіві вже є нотатки,
   * вона оновлює найновішу з них. Якщо нотаток немає — створює новий запис.
   * Після успішної відповіді від сервера локальний стан (`books`) оновлюється
   * точково. Це запобігає повному перезавантаженню списку книг і зберігає
   * поточну позицію прокрутки на екрані.
   *
   * @async
   * @param {number} id - Унікальний ідентифікатор книги.
   * @param {string} noteText - Актуальний текст нотатки для збереження.
   * @returns {Promise<void>}
   * @throws Виводить повідомлення про помилку (`alert`) та логує її в консоль у разі збою запиту.
   */
  const handleNoteUpdate = async (id, noteText) => {
    try {
      // Знаходимо книгу в поточному стейті
      const bookToUpdate = books.find((b) => b.id === id);
      const notesArray = bookToUpdate?.book_notes || [];
      const latestNote =
        notesArray.length > 0 ? notesArray[notesArray.length - 1] : null;

      let savedNote;

      // Виконуємо запит до сервера
      if (latestNote) {
        // Оновлюємо існуючу останню нотатку
        savedNote = await apiNotesQuotes.updateNote(latestNote.id, {
          content: noteText,
        });
      } else {
        // Створюємо нову, якщо архів був порожній
        if (noteText.trim()) {
          savedNote = await apiNotesQuotes.addNote(id, noteText);
        }
      }

      // ОНОВЛЮЄМО СТАН ЛОКАЛЬНО
      setBooks((prevBooks) =>
        prevBooks.map((b) => {
          if (b.id === id) {
            // Створюємо копію масиву нотаток
            const updatedNotes = [...(b.book_notes || [])];

            if (latestNote) {
              // Замінюємо останню нотатку оновленою від сервера
              updatedNotes[updatedNotes.length - 1] = savedNote;
            } else if (savedNote) {
              // Додаємо щойно створену нотатку в масив
              updatedNotes.push(savedNote);
            }

            return { ...b, book_notes: updatedNotes };
          }
          return b;
        }),
      );

      console.log("Нотатка синхронізована локально, позиція збережена");
    } catch (error) {
      console.error("Помилка при збереженні нотатки:", error);
      alert("Не вдалося зберегти нотатку");
    }
  };

  /**
   * Логіка трансформації даних: фільтрація та групування за жанрами.
   * Використовує `useMemo` для запобігання зайвих обчислень при рендерингу.
   * @returns {{filteredBooks: Array, groupedBooks: Object|null}}
   */
  const { filteredBooks, groupedBooks } = useMemo(() => {
    const list = Array.isArray(books) ? [...books] : [];

    // Групування за жанром
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
  }, [books, currentSort]);

  // --- Візуальна частина (Рендеринг) ---
  if (isLoading && books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary/60" />
        <p className="animate-pulse font-medium text-lg">
          Завантаження вашої бібліотеки...
        </p>
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
            { id: "favorite", label: "Улюблені", count: counts.fav },
          ].map((cat) => (
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
            onClick={() =>
              setCurrentSort(currentSort === "genre" ? null : "genre")
            }
            className="h-8 text-[10px]"
          >
            <Tag className="w-3 h-3 mr-2" /> За жанром
          </Button>

          <Button
            variant={
              currentSort?.startsWith("rating") ? "secondary" : "outline"
            }
            onClick={() =>
              setCurrentSort((prev) =>
                prev === "rating-desc" ? "rating-asc" : "rating-desc",
              )
            }
            className="h-8 text-[10px] gap-2"
          >
            <Star className="w-3 h-3" /> За рейтингом
            {currentSort === "rating-asc" ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setCurrentFilter("all");
              setCurrentSort(null);
            }}
            className="text-[10px] text-red-500 hover:bg-red-50"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Скинути
          </Button>
        </div>
      </div>

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <div className="min-h-[400px]">
        {/* Якщо в базі взагалі немає жодної книги */}
        {books.length === 0 && !isLoading ? (
          <div className="text-center py-24 border-2 border-dashed rounded-[2rem] bg-muted/20 flex flex-col items-center gap-4">
            <div className="p-4 bg-background rounded-full shadow-sm">
              <BookPlus className="w-8 h-8 text-primary/40" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-medium text-muted-foreground">
                Ваша бібліотека поки що порожня.
              </p>
              <p className="text-sm text-muted-foreground/80">
                Додайте першу книгу через пошук, щоб почати!
              </p>
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
                      <h2 className="text-xl font-bold text-primary">
                        {genre} ({items.length})
                      </h2>
                      <div className="h-px flex-1 bg-border/60"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {items.map((book) => (
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
                  {filteredBooks.map((book) => (
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
                      У категорії "
                      {currentFilter === "favorite"
                        ? "Улюблені"
                        : currentFilter}
                      " поки немає книг.
                    </p>
                    <p className="text-sm text-muted-foreground/60 mt-2">
                      Спробуйте змінити фільтр або позначити книги іншим
                      статусом.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {/* КНОПКА ЗАВАНТАЖИТИ ЩЕ */}
        {nextPageUrl && (
          <div className="flex justify-center pt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => loadBooks(nextPageUrl)}
              disabled={isMoreLoading}
              className="rounded-xl px-8 border-primary text-primary hover:bg-primary/5 shadow-sm"
            >
              {isMoreLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Завантаження...
                </>
              ) : (
                "Завантажити ще 20 книг"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
