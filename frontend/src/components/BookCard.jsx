/**
 * @file Компонент картки книги.
 * Відповідає за візуальне відображення інформації про книгу.
 */
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Star, Heart, FileText, Save, Trash2, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./ui/ImageWithFallback";

export function BookCard({ book, onBookClick, onStatusChange, onToggleFavorite, onDelete, onNoteUpdate }) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(book.note || "");

  const getActionConfig = () => {
    switch (book.status) {
      case 'want-to-read':
        return { text: "Почати читати", variant: "default", nextStatus: 'reading' };
      case 'reading':
        return { text: "Завершити", variant: "secondary", nextStatus: 'read' };
      case 'read':
        return { text: "Знову", variant: "outline", nextStatus: 'want-to-read' };
      default:
        return { text: "Оновити", variant: "outline", nextStatus: 'reading' };
    }
  };

  const action = getActionConfig();

  const handleSaveNote = (e) => {
    e.stopPropagation();
    if (onNoteUpdate) onNoteUpdate(book.id, noteText);
    setIsEditingNote(false);
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
        <div className="flex gap-4 cursor-pointer" onClick={() => onBookClick(book)}>
          <div className="w-24 h-32 flex-shrink-0 shadow-md rounded overflow-hidden border">
            <ImageWithFallback src={book.cover} alt={book.title} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="font-bold text-base line-clamp-2 leading-tight mb-1 pr-4">{book.title}</h3>
            <p className="text-xs text-muted-foreground truncate mb-1">{book.author}, {book.year} р.</p>
            <Badge variant="secondary" className="w-fit text-[10px] h-5 mb-2 uppercase">{book.genre}</Badge>
            
            {/* РЕЙТИНГ ТА КНОПКИ ДІЙ (серце + кошик поруч) */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-bold">{book.rating || "0.0"}</span>
              </div>
              
              <div className="flex items-center gap-0.5">
                {/* Кнопка Улюблене */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(book.id); }}
                  className={`p-1.5 rounded-full hover:bg-muted transition-colors ${book.isFavorite ? 'text-red-500' : 'text-muted-foreground'}`}
                  title={book.isFavorite ? "Видалити з улюблених" : "Додати в улюблені"}
                >
                  <Heart className={`w-5 h-5 ${book.isFavorite ? 'fill-current' : ''}`} />
                </button>

                {/* Кнопка Видалення (тільки для власних книг) */}
                {book.isCustom && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(book); }}
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
        <div className="mt-4 flex items-center justify-between py-2 border-y border-border/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${book.status === 'reading' ? 'bg-blue-500' : book.status === 'read' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {book.status === 'reading' ? 'Читаю' : book.status === 'read' ? 'Прочитано' : 'В планах'}
            </span>
          </div>
          <Button 
            size="sm" 
            variant={action.variant} 
            className="h-7 text-[10px] font-bold"
            onClick={(e) => { e.stopPropagation(); onStatusChange(book.id, action.nextStatus); }}
          >
            {action.text} <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {/* ПРОГРЕС */}
        {(book.status === 'reading' || book.status === 'read') && (
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
                onClick={(e) => { e.stopPropagation(); setIsEditingNote(true); }}
                className="h-5 px-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Редагувати
              </Button>
            )}
          </div>

          {isEditingNote ? (
            <div className="space-y-2" onClick={e => e.stopPropagation()}>
              <Textarea 
                value={noteText} 
                onChange={e => setNoteText(e.target.value)}
                className="text-sm min-h-[60px] bg-background"
                placeholder="Ваші думки..."
              />
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => setIsEditingNote(false)} className="h-6 text-[10px]">Скасувати</Button>
                <Button size="sm" onClick={handleSaveNote} className="h-6 text-[10px]"><Save className="w-3 h-3 mr-1" /> Зберегти</Button>
              </div>
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground bg-muted/30 p-2 rounded line-clamp-2 leading-relaxed">
              {book.note || "Нотатки відсутні..."}
            </p>
          )}
        </div>

        {/* КНОПКА "ДЕТАЛЬНІШЕ" */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold" onClick={() => onBookClick(book)}>
            Детальніше про книгу
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}