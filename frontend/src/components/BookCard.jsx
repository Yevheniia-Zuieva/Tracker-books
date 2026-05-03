/**
 * @file Компонент картки книги для інтерфейсу бібліотеки.
 * @description Візуальний блок, що відображає основні метадані книги (назва, автор, обкладинка),
 * її поточний стан у системі (статус читання, прогрес) та надає інструменти швидкого керування
 * (зміна статусу, редагування нотатки, додавання в обране).
 */
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Star, Heart, FileText, Save, Trash2, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { useNavigate } from "react-router-dom";

/**
 * Компонент BookCard.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {Object} props.book - Об'єкт книги з даними (id, title, author, status, progress тощо).
 * @param {Function} props.onStatusChange - Функція зміни статусу (напр., перехід з "хочу" до "читаю").
 * @param {Function} props.onToggleFavorite - Перемикач статусу "Улюблене".
 * @param {Function} props.onDelete - Коллбек для видалення книги з бази.
 * @param {Function} props.onNoteUpdate - Функція для збереження змін у текстовій нотатці.
 * @returns {React.JSX.Element} Картка книги зі станами взаємодії.
 */
export function BookCard({
  book,
  onStatusChange,
  onToggleFavorite,
  onDelete,
  onNoteUpdate,
}) {
  /**
   * Стан режиму редагування нотатки
   * @type {boolean}
   */
  const [isEditingNote, setIsEditingNote] = useState(false);

  /**
   * Нормалізований масив нотаток.
   * Підтримує різні формати відповіді від API (book_notes або notes)
   * та запобігає помилкам, якщо масив відсутній.
   * @type {Array<Object>}
   */
  const notesArray = book.book_notes || book.notes || [];

  /**
   * Текст найновішої нотатки для первинного відображення або редагування.
   * Реалізує логіку зворотної сумісності (Backward Compatibility):
   * 1. Бере контент останнього об'єкта з масиву нотаток.
   * 2. Якщо масив порожній — робить fallback на застаріле текстове поле `book.note`.
   * 3. Якщо нічого немає — повертає порожній рядок.
   * @type {string}
   */
  const latestNoteText =
    notesArray.length > 0
      ? notesArray[notesArray.length - 1].content
      : book.note || ""; // fallback на старе поле, якщо воно ще є в БД

  /**
   * Локальний стан тексту нотатки для редагування
   * @type {string}
   */
  const [noteText, setNoteText] = useState(latestNoteText);

  /**
   * Навігація по маршрутах
   * @type {Function}
   */
  const navigate = useNavigate();

  /**
   * Конфігуратор станів кнопки дії.
   * Визначає текст, стиль та наступний логічний крок у життєвому циклі читання книги.
   * @returns {{text: string, variant: string, nextStatus: string}} Об'єкт налаштувань кнопки.
   */
  const getActionConfig = () => {
    switch (book.status) {
      case "want-to-read":
        return {
          text: "Почати читати",
          variant: "default",
          nextStatus: "reading",
        };
      case "reading":
        return { text: "Завершити", variant: "secondary", nextStatus: "read" };
      case "read":
        return {
          text: "Знову",
          variant: "outline",
          nextStatus: "want-to-read",
        };
      default:
        return { text: "Оновити", variant: "outline", nextStatus: "reading" };
    }
  };

  const action = getActionConfig();

  /**
   * Обробник збереження нотатки.
   * Зупиняє спливання події (event propagation), щоб не викликати клік по картці.
   * @param {React.MouseEvent} e - Подія кліку.
   */
  const handleSaveNote = (e) => {
    e.stopPropagation();
    // Викликаємо функцію з HomePage (яка або оновить останню, або створить нову)
    if (onNoteUpdate) onNoteUpdate(book.id, noteText);
    setIsEditingNote(false);
  };

  /** Перехід на сторінку детальної інформації про книгу */
  const handleCardClick = () => {
    navigate(`/books/${book.id}`);
  };

  return (
    <Card className="relative hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary group bg-card overflow-hidden">
      {/* Бейдж для кастомних книг */}
      {book.isCustom && (
        <div className="bg-primary text-[10px] text-primary-foreground font-bold px-2 py-0.5 absolute top-0 right-0 rounded-bl-lg z-10 shadow-sm">
          ДОДАНА МНОЮ
        </div>
      )}

      <CardContent className="p-4 flex flex-col h-full">
        {/* ОСНОВНА ІНФО */}
        <div className="flex gap-4">
          <div className="w-24 h-32 flex-shrink-0 shadow-md rounded overflow-hidden border">
            <ImageWithFallback
              src={book.cover}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="font-bold text-base line-clamp-2 leading-tight mb-1 pr-4">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate mb-1">
              {book.author}, {book.year} р.
            </p>
            <Badge
              variant="secondary"
              className="w-fit text-[10px] h-5 mb-2 uppercase"
            >
              {book.genre}
            </Badge>

            {/* РЕЙТИНГ ТА КНОПКИ ДІЙ (серце + кошик поруч) */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-bold">
                  {book.rating || "0.0"}
                </span>
              </div>

              <div className="flex items-center gap-0.5">
                {/* Кнопка Улюблене */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(book.id);
                  }}
                  className={`p-1.5 rounded-full hover:bg-muted transition-colors ${book.isFavorite ? "text-red-500" : "text-muted-foreground"}`}
                  title={
                    book.isFavorite
                      ? "Видалити з улюблених"
                      : "Додати в улюблені"
                  }
                >
                  <Heart
                    className={`w-5 h-5 ${book.isFavorite ? "fill-current" : ""}`}
                  />
                </button>

                {/* Кнопка Видалення (тільки для власних книг) */}
                {book.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(book);
                    }}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Видалити книгу"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* СТАТУС ТА ДІЯ */}
        {/* СТАТУС ТА ДІЯ */}
        <div className="mt-4 flex items-center justify-between py-2 border-y border-border/50">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${book.status === "reading" ? "bg-blue-500" : book.status === "read" ? "bg-green-500" : "bg-yellow-500"}`}
            />
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {book.status === "reading"
                ? "Читаю"
                : book.status === "read"
                  ? "Прочитано"
                  : "В планах"}
            </span>
          </div>
          
          {/* Умовний рендер: якщо прочитано - плашка, інакше - кнопка дії */}
          {book.status === "read" ? (
            <div 
              title="Щоб почати читати знову та зберегти архів, перейдіть на сторінку деталей книги"
              onClick={(e) => e.stopPropagation()} 
            >
              <Badge variant="secondary" className="cursor-help bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 text-[10px] uppercase font-bold px-2 py-1">
                В архіві
              </Badge>
            </div>
          ) : (
            <Button
              size="sm"
              variant={action.variant}
              className="h-7 text-[10px] font-bold"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(book.id, action.nextStatus);
              }}
            >
              {action.text} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>

        {/* ПРОГРЕС */}
        {(book.status === "reading" || book.status === "read") && (
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-muted-foreground uppercase">Прогрес</span>
              <span>{book.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${book.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* НОТАТКИ */}
        <div className="mt-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <FileText className="w-3 h-3" /> Нотатка
            </span>
            {!isEditingNote && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Оновлюємо стейт перед редагуванням (на випадок, якщо дані змінилися ззовні)
                  setNoteText(latestNoteText);
                  setIsEditingNote(true);
                }}
                className="h-5 px-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Редагувати
              </Button>
            )}
          </div>

          {isEditingNote ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="text-sm min-h-[60px] bg-background"
                placeholder="Ваші думки..."
              />
              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNoteText(latestNoteText); // Відміна змін
                    setIsEditingNote(false);
                  }}
                  className="h-6 text-[10px]"
                >
                  Скасувати
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  className="h-6 text-[10px]"
                >
                  <Save className="w-3 h-3 mr-1" /> Зберегти
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground bg-muted/30 p-2 rounded line-clamp-2 leading-relaxed">
              {/* Відображаємо останню нотатку, або fallback-текст */}
              {latestNoteText || "Нотатки відсутні..."}
            </p>
          )}
        </div>

        {/* КНОПКА "ДЕТАЛЬНІШЕ" */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            Детальніше про книгу
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
