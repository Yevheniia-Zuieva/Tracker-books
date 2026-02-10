import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Star, Heart, FileText, Save } from "lucide-react";
import { ImageWithFallback } from "./ui/ImageWithFallback";

export function BookCard({ book, onBookClick, compact = false, onNoteUpdate }) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(book.note || "");

  const getStatusBadge = (status) => {
    const statusMap = {
      reading: { label: "Читаю", variant: "default" },
      read: { label: "Прочитано", variant: "secondary" },
      "want-to-read": { label: "Хочу прочитати", variant: "outline" },
      favorite: { label: "Улюблені", variant: "destructive" },
    };

    return statusMap[status] || { label: status, variant: "outline" };
  };

  const statusInfo = getStatusBadge(book.status);

  const handleSaveNote = (e) => {
    e.stopPropagation();
    if (onNoteUpdate) {
      onNoteUpdate(book.id, noteText);
    }
    setIsEditingNote(false);
  };

  const handleNoteClick = (e) => {
    e.stopPropagation();
    setIsEditingNote(true);
  };

  return (
    <Card
      className={`hover:shadow-lg transition-shadow bg-card text-card-foreground border ${compact ? "h-auto min-h-64" : "h-auto min-h-80"}`}
    >
      <CardContent className="p-4">
        {/* Клік по картці відкриває деталі */}
        <div
          className="flex gap-4 cursor-pointer"
          onClick={() => onBookClick(book)}
        >
          <div
            className={`${compact ? "w-16 h-20" : "w-20 h-28"} flex-shrink-0 overflow-hidden rounded bg-muted`}
          >
            <ImageWithFallback
              src={book.cover}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-medium truncate ${compact ? "text-sm" : "text-base"}`}
            >
              {book.title}
            </h3>
            <p
              className={`text-muted-foreground truncate ${compact ? "text-xs" : "text-sm"}`}
            >
              {book.author}
            </p>
            <p
              className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}
            >
              {book.genre}
            </p>
            {book.year && book.year > 0 && (
              <p
                className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}
              >
                {book.year} рік
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={statusInfo.variant} className="text-xs">
                {statusInfo.label}
              </Badge>

              {book.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-yellow-500" />
                  <span className="text-xs font-medium">{book.rating}/5</span>
                </div>
              )}

              {book.status === "favorite" && (
                <Heart className="w-3 h-3 fill-current text-red-500" />
              )}
            </div>

            {book.status === "reading" && typeof book.progress === "number" && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Прогрес</span>
                  <span>{book.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
                {book.currentPage && book.totalPages ? (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Сторінка {book.currentPage} з {book.totalPages}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Секція нотаток */}
        <div className="mt-4 pt-3 border-t border-border">
          {book.note && !isEditingNote ? (
            <div className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Нотатка:
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNoteClick}
                  className="h-5 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Редагувати
                </Button>
              </div>
              <p className="text-xs text-foreground bg-muted/50 p-2 rounded border border-transparent hover:border-border transition-colors line-clamp-3">
                {book.note}
              </p>
            </div>
          ) : isEditingNote ? (
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Редагування:
                </span>
              </div>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Ваша нотатка до книги..."
                className="text-xs min-h-[80px] resize-none mb-2 focus-visible:ring-1"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingNote(false);
                    setNoteText(book.note || "");
                  }}
                  className="text-xs h-7 px-3"
                >
                  Скасувати
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  className="text-xs h-7 px-3"
                >
                  <Save className="w-3 h-3 mr-1.5" />
                  Зберегти
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNoteClick}
              className="text-xs h-8 w-full justify-start text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent"
            >
              <FileText className="w-3 h-3 mr-2" />
              Додати нотатку...
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
