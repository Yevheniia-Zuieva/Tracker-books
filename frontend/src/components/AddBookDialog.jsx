import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { apiBooks } from "../api/ApiService";

export function AddBookDialog({ isOpen, onClose, onBookAdded }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    genre: "",
    year: "",
    totalPages: "0",
    status: "want-to-read",
    description: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiBooks.addBook({
        title: formData.title,
        author: formData.author,
        genre: formData.genre,
        year: formData.year ? parseInt(formData.year) : undefined,
        totalPages: formData.totalPages ? parseInt(formData.totalPages) : 0,
        status: formData.status,
        description: formData.description,
        cover: "",
      });

      onBookAdded();
      onClose();
      setFormData({
        title: "",
        author: "",
        genre: "",
        year: "",
        totalPages: "0",
        status: "want-to-read",
        description: "",
      });
    } catch (error) {
      console.error("Помилка додавання книги:", error);
      alert("Не вдалося додати книгу.");
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = formData.title.trim() !== "" && formData.author.trim() !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-lg rounded-xl shadow-lg border max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Додати книгу вручну</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Назва книги *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Введіть назву"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Автор *</Label>
            <Input
              id="author"
              name="author"
              placeholder="Введіть автора"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Жанр</Label>
              <Input
                id="genre"
                name="genre"
                placeholder="Жанр"
                value={formData.genre}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Рік</Label>
              <Input
                id="year"
                name="year"
                type="number"
                placeholder="2025"
                value={formData.year}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalPages">Кількість сторінок</Label>
            <Input
              id="totalPages"
              name="totalPages"
              type="number"
              placeholder="0"
              value={formData.totalPages}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="want-to-read">Хочу прочитати</option>
              <option value="reading">Читаю зараз</option>
              <option value="read">Прочитано</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Опис</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Короткий опис"
              value={formData.description}
              onChange={handleChange}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Зберегти
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
