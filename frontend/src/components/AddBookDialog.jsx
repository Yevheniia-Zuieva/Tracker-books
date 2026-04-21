/**
 * @file Компонент модального вікна для ручного додавання книг.
 * @description Реалізує інтерфейс створення запису про книгу в базі даних користувача.
 * Включає комплексну валідацію вхідних даних, автоматичне визначення статусу
 * читання на основі прогресу та обробку зображень-заглушок.
 */

import { useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { apiBooks } from "../api/ApiService";

/**
 * Компонент AddBookDialog.
 * Дозволяє користувачеві вносити книги, які відсутні у зовнішніх реєстрах (Google Books).
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {boolean} props.isOpen - Стан відображення модального вікна.
 * @param {Function} props.onClose - Функція закриття вікна.
 * @param {Function} [props.onBookAdded] - Коллбек, що викликається після успішного збереження.
 * @returns {React.JSX.Element|null} Рендерить модальне вікно або null, якщо воно закрите.
 */
export function AddBookDialog({ isOpen, onClose, onBookAdded }) {
  /** @type {[boolean, Function]} Стан процесу відправки даних на сервер */
  const [isLoading, setIsLoading] = useState(false);

  /** * @type {[Object, Function]} Об'єкт стану форми з початковими значеннями. */
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    genre: "",
    cover: "",
    year: "",
    rating: "0",
    totalPages: "",
    currentPage: "0",
    status: "want-to-read",
    description: "",
    note: "",
    isFavorite: false,
  });

  if (!isOpen) return null;

  /**
   * Універсальний обробник змін для полів форми.
   * Підтримує текстові поля, числові значення та чекбокси.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} e - Подія зміни.
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /**
   * Обробник відправки форми.
   * Реалізує бізнес-логіку валідації та нормалізації даних перед запитом до API.
   * @async
   * @param {React.FormEvent} e - Подія сабміту.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- ВАЛІДАЦІЯ ---
    // Перевірка на обов'язкові поля та логічну цілісність числових показників
    if (!formData.title.trim()) {
      alert("⚠️ Будь ласка, введіть назву книги!");
      return;
    }

    const total = Number(formData.totalPages) || 0;
    const current = Number(formData.currentPage) || 0;
    const bookYear = Number(formData.year);
    const bookRating = Number(formData.rating);
    const currentYear = new Date().getFullYear();

    if (total < 0 || current < 0) {
      alert("Кількість сторінок не може бути від’ємною!");
      return;
    }

    if (current > total && total > 0) {
      alert(
        `Помилка: ви вказали, що прочитали ${current} сторінок, хоча в книзі всього ${total}!`,
      );
      return;
    }

    if (formData.year !== "" && (bookYear <= 0 || bookYear > currentYear + 2)) {
      alert(
        `Рік видання не може бути від'ємним або знаходитися в далекому майбутньому!`,
      );
      return;
    }

    if (bookRating < 0 || bookRating > 5) {
      alert("Рейтинг має бути від 0 до 5.");
      return;
    }

    setIsLoading(true);

    // --- ЛОГІКА СТАТУСУ ТА ОБКЛАДИНКИ ---
    // Автоматичне коригування статусу на основі введеного прогресу
    let finalStatus = formData.status;
    if (total > 0 && current === total) {
      finalStatus = "read";
    } else if (
      current > 0 &&
      current < total &&
      finalStatus === "want-to-read"
    ) {
      finalStatus = "reading";
    }

    // --- ГЕНЕРАЦІЯ ОБКЛАДИНКИ ---
    // Використання сервісу Placehold.co для створення заглушки, якщо URL не вказано
    const finalCover =
      formData.cover.trim() !== ""
        ? formData.cover
        : `https://placehold.co/400x600/e0f7ff/0369a1?text=${encodeURIComponent(formData.title)}`;

    try {
      /** Виконання запиту до API через сервіс apiBooks*/
      await apiBooks.addBook({
        title: formData.title.trim(),
        author: formData.author.trim() || "Невідомий автор",
        genre: formData.genre.trim() || "Без жанру",
        year: bookYear || currentYear,
        rating: bookRating,
        totalPages: total,
        currentPage: current,
        status: finalStatus,
        cover: finalCover,
        description: formData.description,
        note: formData.note,
        isFavorite: formData.isFavorite,
        isCustom: true, // Помітка, що книгу додано вручну
      });

      if (onBookAdded) onBookAdded();
      onClose();

      // Скидання форми до початкового стану для наступного додавання
      setFormData({
        title: "",
        author: "",
        genre: "",
        cover: "",
        year: "",
        rating: "5",
        totalPages: "",
        currentPage: "0",
        status: "want-to-read",
        description: "",
        note: "",
        isFavorite: false,
      });
    } catch (error) {
      console.error("Помилка додавання книги:", error);
      alert("Не вдалося зберегти книгу у трекер.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Контейнер модального вікна */}
      <div className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl border max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Хедер */}
        <div className="flex items-center justify-between p-6 border-b bg-muted/20">
          <div>
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              ✨ Додати нову перлину
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Тільки назва є обов'язковою, інше — за бажанням!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Форма зі скролом */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ліва колонка: Текстова інформація */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Назва книги *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Напр: Гаррі Поттер..."
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Автор</Label>
                <Input
                  id="author"
                  name="author"
                  placeholder="Хто написав?"
                  value={formData.author}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Жанр</Label>
                <Input
                  id="genre"
                  name="genre"
                  placeholder="Фентезі, біографія..."
                  value={formData.genre}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">Посилання на обкладинку (URL)</Label>
                <Input
                  id="cover"
                  name="cover"
                  placeholder="Вставте URL зображення"
                  value={formData.cover}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Права колонка: Числові дані та статуси */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Рік видання</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    placeholder="2024"
                    value={formData.year}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Рейтинг (0-5)</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalPages">Всього сторінок</Label>
                  <Input
                    id="totalPages"
                    name="totalPages"
                    type="number"
                    placeholder="450"
                    value={formData.totalPages}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentPage">Вже прочитано</Label>
                  <Input
                    id="currentPage"
                    name="currentPage"
                    type="number"
                    value={formData.currentPage}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Ваш статус</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="want-to-read">Хочу прочитати</option>
                  <option value="reading">Читаю зараз</option>
                  <option value="read">Вже прочитано</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <input
                  type="checkbox"
                  id="isFavorite"
                  name="isFavorite"
                  checked={formData.isFavorite}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isFavorite" className="cursor-pointer">
                  Додати в "Улюблені" ❤️
                </Label>
              </div>
            </div>
          </div>

          {/* Нижня частина форми: Багаторядкові текстові поля */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Короткий опис</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Про що книга?"
                value={formData.description}
                onChange={handleChange}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Особиста нотатка</Label>
              <Textarea
                id="note"
                name="note"
                placeholder="Ваші думки"
                value={formData.note}
                onChange={handleChange}
                className="min-h-[80px]"
              />
            </div>
          </div>
        </form>

        {/* Футер */}
        <div className="p-6 border-t bg-muted/20 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Скасувати
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-[2] shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Зберегти у трекер
          </Button>
        </div>
      </div>
    </div>
  );
}
