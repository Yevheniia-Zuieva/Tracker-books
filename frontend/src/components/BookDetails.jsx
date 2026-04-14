import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Star, Heart, Play, Pause, 
  Square, BookOpen, Trash2, Save, Plus, Loader2, Calendar, Quote, Check, AlertCircle
} from 'lucide-react';

import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

import { apiBooks, apiNotesQuotes } from "../api/ApiService";

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  
  const [localNote, setLocalNote] = useState("");
  const [noteStatus, setNoteStatus] = useState('idle');
  const [newQuote, setNewQuote] = useState("");
  const [tempPage, setTempPage] = useState("");
  const [pageError, setPageError] = useState(""); 
  const [dates, setDates] = useState({ startDate: "", endDate: "" });

  const fetchBookData = useCallback(async () => {
    try {
      const data = await apiBooks.getBookDetail(id);
      setBook(data);
      setLocalNote(data.note || "");
      setTempPage(data.currentPage || 0);
      setDates({ startDate: data.startDate || "", endDate: data.endDate || "" });
    } catch (err) {
      console.error("Помилка завантаження", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]); 

  useEffect(() => { 
    window.scrollTo(0, 0);
    fetchBookData(); 
  }, [id, fetchBookData]); 

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // --- ВАЛІДАЦІЯ ТА ОНОВЛЕННЯ ПРОГРЕСУ ---
  const handlePageUpdate = async () => {
    const newPage = parseInt(tempPage, 10);
    
    // 1. Перевірка на число та від'ємне значення
    if (isNaN(newPage) || newPage < 0) {
      setPageError("Введіть коректне число");
      return;
    }

    // 2. Перевірка на перевищення ліміту сторінок
    if (book.totalPages && newPage > book.totalPages) {
      setPageError(`Не може бути більше за ${book.totalPages}`);
      return;
    }

    setPageError(""); // Очищуємо помилку, якщо все ок

    let nextStatus = book.status;
    if (book.status === 'want-to-read' && newPage > 0) nextStatus = 'reading';
    if (newPage >= book.totalPages && book.totalPages > 0) nextStatus = 'read';

    try {
      const updated = await apiBooks.updateBook(id, { 
        currentPage: newPage,
        status: nextStatus
      });
      setBook(prev => ({ ...prev, ...updated }));
      setIsEditingProgress(false);
    } catch (err) {
      console.error(err);
      setPageError("Помилка сервера");
    }
  };

  const formatTotalTime = (totalSeconds) => {
    if (!totalSeconds) return "0с";
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}д`);
    if (hours > 0) parts.push(`${hours}г`);
    if (minutes > 0) parts.push(`${minutes}хв`);
    parts.push(`${secs}с`);
    return parts.join(" ");
  };

  const isNoteModified = localNote !== (book?.note || "");

  const handleSaveNote = async () => {
    if (!isNoteModified) return;
    setNoteStatus('saving');
    try {
      await apiBooks.updateBook(id, { note: localNote });
      setBook(prev => ({ ...prev, note: localNote }));
      setNoteStatus('saved');
      setTimeout(() => setNoteStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setNoteStatus('idle');
      alert("Не вдалося зберегти нотатку");
    }
  };

  const handleUpdateField = async (field, value) => {
    try {
      const updated = await apiBooks.updateBook(id, { [field]: value });
      setBook(prev => ({ ...prev, ...updated }));
      if (field === 'startDate' || field === 'endDate') setIsEditingDates(false);
    } catch (err) { console.error(err); }
  };

  const handleFinishSession = async () => {
    const currentSessionSeconds = seconds;
    setIsTimerRunning(false);
    try {
      await apiBooks.addSession(id, { duration: currentSessionSeconds });
      setSeconds(0);
      fetchBookData();
    } catch (err) { 
      console.error(err);
      setIsTimerRunning(true);
      alert("Помилка збереження сесії"); 
    }
  };

  const handleAddQuote = async () => {
    if (!newQuote.trim()) return;
    try {
      await apiNotesQuotes.addQuote(id, newQuote);
      setNewQuote("");
      fetchBookData();
    } catch (err) { console.error(err); }
  };

  const totalSeconds = useMemo(() => {
    return (book?.readingSessions || []).reduce((acc, s) => acc + s.duration, 0);
  }, [book]);

  if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin" /></div>;
  if (!book) return <div className="p-20 text-center">Книга не знайдена</div>;

  const progressPercent = Math.round((book.currentPage / (book.totalPages || 1)) * 100) || 0;
  const sessionsToShow = showAllSessions ? (book.readingSessions || []) : (book.readingSessions || []).slice(-5).reverse();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 text-left">
      
      <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 w-fit">
        <ArrowLeft size={18} /> <span className="font-medium">Назад до бібліотеки</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <img src={book.cover} alt={book.title} className="w-full rounded-2xl shadow-2xl border object-cover aspect-[2/3]" />
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-black">{book.title}</h1>
            <p className="text-xl text-muted-foreground italic">{book.author}</p>
            <Badge className="mt-2 uppercase">{book.status === 'reading' ? 'Читаю' : book.status === 'read' ? 'Прочитано' : 'В планах'}</Badge>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Короткий зміст</h3>
                <p className="text-sm leading-relaxed">{book.description || "Додайте опис книги..."}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <DetailItem label="Жанр" value={book.genre} />
                <DetailItem label="Рік" value={book.year} />
                <DetailItem label="Сторінок" value={book.totalPages} />
                <DetailItem label="Додано" value={new Date(book.addedDate).toLocaleDateString()} />
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} onClick={() => handleUpdateField('rating', s)} className={`h-6 w-6 cursor-pointer ${s <= (book.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <Button variant={book.isFavorite ? "destructive" : "secondary"} onClick={() => handleUpdateField('isFavorite', !book.isFavorite)} className="gap-2">
                  <Heart size={16} className={book.isFavorite ? "fill-current" : ""} />
                  {book.isFavorite ? "Видалити з улюблених" : "Додати до улюблених"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ПРОГРЕС З ВАЛІДАЦІЄЮ */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><BookOpen className="text-primary" /> Прогрес</h3>
                <button onClick={() => { setIsEditingProgress(!isEditingProgress); setPageError(""); }} title="Це для введення поточної сторінки"><Edit2 size={16} /></button>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden border">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-sm text-center font-bold">{progressPercent}% ({book.currentPage} / {book.totalPages})</p>
              
              {isEditingProgress && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1 max-w-[150px]">
                      <Input 
                        type="text" 
                        value={tempPage} 
                        onChange={(e) => {
                          // Дозволяємо лише цифри
                          if (/^\d*$/.test(e.target.value)) {
                            setTempPage(e.target.value);
                            setPageError(""); // Скидаємо помилку при вводі
                          }
                        }}
                        className={`h-9 pr-8 ${pageError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        placeholder="Стор."
                      />
                      {pageError && <AlertCircle className="absolute right-2 top-2.5 h-4 w-4 text-destructive" />}
                    </div>
                    <Button size="sm" onClick={handlePageUpdate}>Оновити</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingProgress(false)}>Скасувати</Button>
                  </div>
                  {pageError && <p className="text-[10px] text-destructive font-bold uppercase">{pageError}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Calendar className="text-primary" /> Період читання</h3>
                <button onClick={() => setIsEditingDates(!isEditingDates)}><Edit2 size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center bg-muted/20 p-4 rounded-xl">
                <div><p className="text-[10px] uppercase font-bold text-muted-foreground">Початок</p><p className="font-medium text-sm">{book.startDate || "—"}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-muted-foreground">Завершення</p><p className="font-medium text-sm">{book.endDate || "—"}</p></div>
              </div>
              {isEditingDates && (
                <div className="grid grid-cols-2 gap-2 p-2">
                  <Input type="date" value={dates.startDate} onChange={(e) => setDates({...dates, startDate: e.target.value})} onBlur={() => handleUpdateField('startDate', dates.startDate)} />
                  <Input type="date" value={dates.endDate} onChange={(e) => setDates({...dates, endDate: e.target.value})} onBlur={() => handleUpdateField('endDate', dates.endDate)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Всього витрачено часу</p>
                  <p className="text-2xl font-black text-primary">{formatTotalTime(totalSeconds)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Сесій</p>
                  <p className="text-2xl font-black text-primary">{book.readingSessions?.length || 0}</p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="text-5xl font-mono font-black py-4 text-primary">{new Date(seconds * 1000).toISOString().substr(11, 8)}</div>
                <div className="flex justify-center gap-3">
                  <Button size="lg" onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-48 rounded-xl shadow-md">
                    {isTimerRunning ? <Pause className="mr-2"/> : <Play className="mr-2"/>} {isTimerRunning ? "Пауза" : "Почати читання"}
                  </Button>
                  {seconds > 0 && <Button variant="destructive" onClick={handleFinishSession} className="rounded-xl shadow-md"><Square className="mr-2"/> Завершити</Button>}
                </div>
              </div>
              <div className="pt-6 space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest border-b pb-2">Історія сесій</h4>
                <div className="space-y-2">
                  {sessionsToShow.map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-background rounded-lg border text-sm shadow-sm">
                      <span className="font-bold">{formatTotalTime(s.duration)}</span>
                      <span className="text-muted-foreground">{new Date(s.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {book.readingSessions?.length > 5 && (
                    <button onClick={() => setShowAllSessions(!showAllSessions)} className="text-xs text-primary font-bold hover:underline w-full text-center">
                      {showAllSessions ? "Приховати" : "Переглянути всю історію →"}
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Edit2 size={16} className="text-primary" /> Мої нотатки</h3>
                {isNoteModified && noteStatus === 'idle' && <span className="text-[10px] text-orange-500 font-bold animate-pulse uppercase">Є незбережені зміни</span>}
              </div>
              <Textarea 
                value={localNote} 
                onChange={(e) => { setLocalNote(e.target.value); if (noteStatus === 'saved') setNoteStatus('idle'); }} 
                placeholder="Додайте свої думки про книгу…" 
                className={`min-h-[150px] transition-colors border-none shadow-inner ${isNoteModified ? 'bg-orange-50/30' : 'bg-muted/10'}`}
              />
              <Button onClick={handleSaveNote} disabled={!isNoteModified || noteStatus === 'saving'} variant={noteStatus === 'saved' ? "outline" : "default"} className={`w-full gap-2 transition-all duration-500 ${noteStatus === 'saved' ? "border-green-500 text-green-600 bg-green-50" : ""}`}>
                {noteStatus === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /> Зберігаємо...</> : noteStatus === 'saved' ? <><Check className="h-4 w-4" /> Збережено</> : <><Save size={16} /> {isNoteModified ? "Зберегти зміни" : "Зберегти нотатки"}</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2"><Quote size={18} className="text-primary"/> Цитати</h3>
              <div className="space-y-3">
                {(book.book_quotes || []).map((q, i) => (
                  <div key={i} className="p-3 bg-primary/5 border-l-4 border-primary italic text-sm rounded-r-lg">"{q.content}"</div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input value={newQuote} onChange={(e) => setNewQuote(e.target.value)} placeholder="Нова цитата..." />
                  <Button size="icon" onClick={handleAddQuote}><Plus size={18}/></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="pt-8">
            <Button variant="ghost" className="text-destructive w-full py-8 border border-destructive/20 hover:bg-destructive/10 gap-2" onClick={() => { if(window.confirm("Ви точно хочете видалити книгу?")) apiBooks.deleteBook(id).then(() => navigate('/')); }}>
              <Trash2 size={20} /> Видалити з бібліотеки
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">{label}</p>
    <p className="text-sm font-bold">{value || "—"}</p>
  </div>
);

export default BookDetails;