/**
 * @file AccountPage.jsx
 * @description Повна версія сторінки акаунта.
 * Включає виправлене відображення профілю, розширену статистику та блок річної мети.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Edit2, LogOut, Camera,
  Target, Loader2, Save, History, MessageSquare, Quote, Heart, Info, ChevronDown, ChevronUp
} from "lucide-react";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

import { apiBooks, apiAuth, apiUser } from "../api/ApiService";

const BASE_URL = "http://localhost:8000";

const AccountPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- СТАНИ ---
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  
  const [profile, setProfile] = useState({
    username: "", email: "", status: "", bio: "", yearlyGoal: 0, avatar: null
  });
  const [editForm, setEditForm] = useState({ ...profile });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [serverStats, setServerStats] = useState({
    all: 0, reading: 0, read: 0, want: 0, fav: 0
  });
  
  const [allBooks, setAllBooks] = useState([]); 

  const STATUS_OPTIONS = [
    "Активний читач", "Книжковий черв'як", "Поціновувач класики",
    "Шукач пригод", "Літературний критик", "Дослідник нових світів"
  ];

  const statusMap = {
    'read': { label: 'Прочитано', color: 'bg-green-100 text-green-700 border-green-200' },
    'reading': { label: 'Читаю', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'want-to-read': { label: 'В планах', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  };

  const getFullAvatarUrl = useCallback((url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url; // Якщо URL вже повний (наприклад, з зовнішнього сервера)
    if (url.startsWith('data:')) return url; // Якщо це base64 прев'ю
    return `${BASE_URL}${url}`; // Додаємо домен бекенду до відносного шляху
  }, []);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false); // Показувати модалку
  const [imageToCrop, setImageToCrop] = useState(null); // Оригінал картинки

  // --- ЗАВАНТАЖЕННЯ ДАНИХ ---
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [userData, statsData, booksRes] = await Promise.all([
        apiUser.getProfile(),
        apiBooks.getStats(),
        apiBooks.getAllBooks(null, { limit: 1000 }) 
      ]);

      const mappedProfile = {
        username: userData.username || "Користувач",
        email: userData.email || "",
        status: userData.status || "Активний читач",
        bio: userData.bio || "",
        yearlyGoal: userData.yearly_goal || 50,
        avatar: userData.avatar || null
      };
      setProfile(mappedProfile);
      setEditForm(mappedProfile);
      setAvatarPreview(getFullAvatarUrl(mappedProfile.avatar));

      setServerStats({
        all: statsData.totalBooks || statsData.all || 0,
        read: statsData.readCount || statsData.read || 0,
        reading: statsData.reading || 0,
        want: statsData.want || 0,
        fav: statsData.fav || 0,
      });

      setAllBooks(booksRes.results || booksRes || []);
    } catch (error) {
      console.error("Помилка завантаження:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getFullAvatarUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ОБРОБНИКИ ФАЙЛІВ ---
  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result); // Завантажуємо оригінал
        setShowCropper(true); // Відкриваємо вікно кадрування
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ""; // Очищаємо інпут, щоб можна було вибрати той самий файл ще раз
  };

  // 4. Функція підтвердження обрізки
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    try {
      // Отримуємо вирізаний шматок як файл (Blob)
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      
      // Зберігаємо його для відправки на бекенд
      setAvatarFile(croppedBlob);
      // Робимо тимчасове прев'ю для користувача
      setAvatarPreview(URL.createObjectURL(croppedBlob)); 
      
      setShowCropper(false); // Закриваємо модалку
    } catch (e) {
      console.error(e);
    }
  };

  // --- ЗБЕРЕЖЕННЯ ---
  const handleSaveProfile = async () => {
    try {
      // Валідація імені
      const nameRegex = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9 _]+$/;
      if (!nameRegex.test(editForm.username) || editForm.username.length > 50) {
        alert("Ім'я може містити лише літери, цифри та пробіли (до 50 символів).");
        return;
      }

      // Валідація мети
      const goal = parseInt(editForm.yearlyGoal);
      if (isNaN(goal) || goal < 1 || goal > 999) {
        alert("Мета повинна бути числом від 1 до 999.");
        return;
      }

      // Створення об'єкта FormData
      const formData = new FormData();
      formData.append('username', editForm.username);
      formData.append('status', editForm.status);
      formData.append('bio', editForm.bio || ""); 
      formData.append('yearly_goal', goal);

      //  ДОДАВАННЯ АВАТАРА 
      if (avatarFile) {
        formData.append('avatar', avatarFile, 'avatar.jpeg');
      }

      // Відправка запиту на сервер
      await apiUser.updateProfile(formData);
      
      // Оновлення локальних станів після успіху
      setAvatarFile(null); // Очищаємо вибраний файл
      setIsEditing(false);
      
      // Повне оновлення даних для синхронізації
      await fetchData(); 

      // Відправляємо глобальний сигнал про оновлення профілю
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error) { 
      // Розширена обробка помилок для зручного дебагу
      console.error("Помилка збереження:", error); 
      if (error.response?.data) {
        console.table(error.response.data);
        alert(`Помилка від сервера. Перевірте консоль (F12).`);
      } else {
        alert("Не вдалося зберегти зміни. Спробуйте пізніше.");
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm("Вийти з акаунту?")) {
      apiAuth.logout();
      navigate("/login");
    }
  };

  // МАТЕМАТИЧНА МОДЕЛЬ ОБРОБКИ ДАНИХ 
  const analytics = useMemo(() => {
    if (!allBooks.length && serverStats.all === 0) return null;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];

    const total = serverStats.all;
    const read = serverStats.read;
    const reading = serverStats.reading;
    const want = serverStats.want;
    const fav = serverStats.fav;

    const pagesRead = allBooks.reduce((sum, b) => sum + (b.currentPage || 0), 0);
    const avgPages = allBooks.length > 0 ? Math.round(allBooks.reduce((sum, b) => sum + (b.totalPages || 0), 0) / allBooks.length) : 0;
    const pagesLeft = allBooks.reduce((sum, b) => sum + ((b.totalPages || 0) - (b.currentPage || 0)), 0);

    const withNotes = allBooks.filter(b => (b.book_notes?.length || 0) > 0).length;
    const withQuotes = allBooks.filter(b => (b.book_quotes?.length || 0) > 0).length;
    const rated = allBooks.filter(b => b.rating > 0);
    const avgRating = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : 0;

    const genresSet = new Set(allBooks.map(b => b.genre).filter(Boolean));
    const totalGenres = genresSet.size;

    const yearRead = allBooks.filter(b => b.status === 'read' && b.endDate && new Date(b.endDate).getFullYear() === currentYear).length;
    const monthRead = allBooks.filter(b => {
      if (b.status !== 'read' || !b.endDate) return false;
      const d = new Date(b.endDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;

    // --- РОЗРАХУНОК АКТИВНОСТІ ЧЕРЕЗ СЕСІЇ ---
    
    // Збираємо всі сесії читання з усіх книг в один масив
    const allSessions = allBooks.flatMap(b => b.readingSessions || []);
    
    // Фільтруємо сесії лише за поточний розрахунковий місяць
    const currentMonthSessions = allSessions.filter(s => {
        if (!s.date) return false;
        const d = new Date(s.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    // Знаходимо D_active (Унікальні дні читання в цьому місяці)
    const activeDaysSet = new Set(
        currentMonthSessions.map(s => new Date(s.date).getDate())
    );
    const Dactive = activeDaysSet.size;

    //  M_k: Сумарна кількість сторінок за поточний місяць
    const monthPagesRead = currentMonthSessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);

    // --- Розрахунок RAI  ---
    const w1 = 0.63, w2 = 0.26, w3 = 0.11;
    
    const Vnorm = profile.yearlyGoal > 0 ? Math.min(1, yearRead / profile.yearlyGoal) : 0;
    
    // Відношення днів читання до загальної кількості днів
    const Rnorm = daysInMonth > 0 ? Dactive / daysInMonth : 0; 
    
    const Dnorm = Math.min(1, totalGenres / 5);
    
    const RAI = Math.round((w1 * Vnorm + w2 * Rnorm + w3 * Dnorm) * 100);

    // Прогрес мети в %
    const goalProgress = profile.yearlyGoal > 0 ? Math.round((yearRead / profile.yearlyGoal) * 100) : 0;

    // Гістограми
    const topGenres = Object.entries(allBooks.reduce((acc, b) => { if(b.genre) acc[b.genre] = (acc[b.genre] || 0) + 1; return acc; }, {}))
      .sort((a,b) => b[1]-a[1]).slice(0, 5).map(([name, count]) => ({ name, count, percent: Math.round((count/allBooks.length)*100) }));

    const authorCounts = Object.entries(allBooks.reduce((acc, b) => { if(b.author) acc[b.author] = (acc[b.author] || 0) + 1; return acc; }, {}))
      .sort((a,b) => b[1]-a[1]).slice(0, 5);
    const topAuthors = authorCounts.map(([name, count]) => ({ name, count, percent: Math.round((count / (authorCounts[0]?.[1] || 1)) * 100) }));

    const notedRaw = allBooks.map(b => ({ name: b.title, count: (b.book_notes?.length || 0) + (b.book_quotes?.length || 0) }))
      .filter(b => b.count > 0).sort((a,b) => b.count - a.count).slice(0, 5);
    const topNoted = notedRaw.map(b => ({ ...b, percent: Math.round((b.count / (notedRaw[0]?.count || 1)) * 100) }));

    const mCounts = Array(12).fill(0);
    allBooks.filter(b => b.status === 'read' && b.endDate && new Date(b.endDate).getFullYear() === currentYear)
            .forEach(b => mCounts[new Date(b.endDate).getMonth()]++);
    const monthlyData = mCounts.map((count, i) => ({ 
      name: monthNames[i], count, percent: Math.round((count / Math.max(...mCounts, 1)) * 100) 
    })).filter(m => m.count > 0 || m.name === monthNames[currentMonth]);

    // Історія тепер сортується за реальним часом оновлення (updatedAt)
    const history = [...allBooks].sort((a,b) => new Date(b.updatedAt || b.addedDate) - new Date(a.updatedAt || a.addedDate));

    return {
      total, read, reading, want, fav, pagesRead, avgPages, pagesLeft, avgRating, totalGenres, withNotes, withQuotes,
      yearRead, monthRead, monthPagesRead, // Додали сторінки за місяць (M_k)
      RAI, goalProgress, topGenres, topAuthors, topNoted, monthlyData,
      recent: history.slice(0, 5), fullHistory: history
    };
  }, [allBooks, serverStats, profile.yearlyGoal]);

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  const activity = showAllActivity ? analytics?.fullHistory : analytics?.recent;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 text-left">
      
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Мій акаунт</h1>
          <p className="text-muted-foreground">Персональна статистика та аналітика бібліотеки</p>
        </div>
        <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-primary tracking-widest">Рівень читацької активності</p>
            <p className="text-2xl font-bold text-primary">{analytics?.RAI}%</p>
          </div>
          <div className="relative group flex items-center">
            {/* Сама іконка */}
            <Info size={18} className="text-primary/40 cursor-help transition-colors group-hover:text-primary" />
            
            {/* Блок підказки, який з'являється при наведенні (hover) на контейнер group */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-72 p-3 bg-card border rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-xs leading-relaxed text-foreground">
                <span className="font-bold text-primary block mb-1">Що таке RAI?</span>
                Ваш персональний індекс успіху! Він зростає, коли ви читаєте регулярно, 
                пробуєте нові жанри та наближаєтесь до своєї мети на рік. 
                Стабільність та різноманітність — запорука високого рейтингу.
              </p>
              <div className="absolute top-full right-4 -mt-1 border-8 border-transparent border-t-card"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ЛІВА ПАНЕЛЬ: ПРОФІЛЬ */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[2rem] shadow-sm border bg-card relative overflow-hidden">
            <CardContent className="p-8 space-y-6 text-center relative">
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors"><Edit2 size={16} /></button>
              )}

              {/* АВАТАР */}
              <div 
                className={`relative w-28 h-28 mx-auto rounded-full overflow-hidden group border-4 border-background shadow-md ${isEditing ? 'cursor-pointer' : ''}`}
                onClick={handleAvatarClick}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover transition-filter group-hover:brightness-75" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                    <User size={48} />
                  </div>
                )}
                
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>


              {isEditing ? (
                <div className="space-y-4 text-left">
                  <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Ім'я</label><Input value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} maxLength={50} /></div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Ваш статус</label>
                    <select 
                        value={editForm.status} 
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">Оберіть статус...</option>
                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Про себе</label><Textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} maxLength={500} className="h-24 resize-none" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Річна мета (книг)</label>
                    <Input type="text" value={editForm.yearlyGoal} onChange={(e) => /^\d*$/.test(e.target.value) && setEditForm({...editForm, yearlyGoal: e.target.value})} />
                  </div>
                  <div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Скасувати</Button><Button className="flex-1 gap-2" onClick={handleSaveProfile}><Save size={16}/> Зберегти</Button></div>
                </div>
              ) : (
                <div className="space-y-4">
                    <div>
                    <h2 className="text-xl font-black">{profile.username}</h2>
                    <p className="text-xs text-muted-foreground font-medium mt-1">{profile.email}</p>
                    </div>
                    
                    {/* Статус із заглушкою */}
                    <Badge variant="secondary" className="px-3 py-1 text-xs">
                    {profile.status || "Читач без статусу"}
                    </Badge>
                    
                    {/* Біографія із заглушкою */}
                    <p className={`text-sm leading-relaxed ${!profile.bio ? 'text-muted-foreground/50 italic' : 'text-muted-foreground'}`}>
                    {profile.bio ? `"${profile.bio}"` : "Інформація про себе відсутня. Розкажіть світові, що ви читаєте!"}
                    </p>
                  
                </div>
              )}
            </CardContent>
          </Card>
          <Button variant="outline" className="w-full h-12 rounded-xl text-destructive border-destructive/20 gap-2 font-medium" onClick={handleLogout}><LogOut size={18} /> Вийти з акаунту</Button>
        </div>

        {/* ПРАВА ПАНЕЛЬ: АНАЛІТИКА */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* БЛОК МЕТИ НА РІК */}
          <Card className="rounded-[2rem] shadow-sm border bg-card overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Target size={16} className="text-primary"/> Мета на рік
                </h3>
                <span className="text-sm font-bold text-primary">{analytics?.yearRead} / {profile.yearlyGoal} книг</span>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${analytics?.goalProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Початок року</span>
                  <span>{analytics?.goalProgress}% виконано</span>
                  <span>Ціль: {profile.yearlyGoal}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* РОЗШИРЕНА СТАТИСТИКА */}
          <Card className="rounded-[2rem] shadow-sm border bg-muted/5">
            <CardContent className="p-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6">
                <StatItem value={analytics?.total} label="Всього книг" />
                <StatItem value={analytics?.read} label="Прочитано" />
                <StatItem value={analytics?.reading} label="Зараз читаю" />
                <StatItem value={analytics?.want} label="В планах" />
                
                <StatItem value={analytics?.fav} label="Улюблені" icon={<Heart size={12} className="text-red-500 fill-current"/>} className="border-t pt-10" />
                <StatItem value={analytics?.withNotes} label="З нотатками" icon={<MessageSquare size={12}/>} className="border-t pt-10" />
                <StatItem value={analytics?.withQuotes} label="З цитатами" icon={<Quote size={12}/>} className="border-t pt-10" />
                <StatItem value={analytics?.totalGenres} label="Жанрів" className="border-t pt-10" />

                <StatItem value={analytics?.pagesRead} label="Сторінок" className="border-t pt-10" />
                <StatItem value={analytics?.avgPages} label="Сер. об'єм" className="border-t pt-10" />
                <StatItem value={analytics?.monthRead} label="За цей місяць" className="border-t pt-10" />
                <StatItem value={analytics?.avgRating} label="Сер. оцінка" className="border-t pt-10" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Топ-5 Жанрів" data={analytics?.topGenres} />
            <ChartCard title="Активність року" data={analytics?.monthlyData} />
            <ChartCard title="Найбільше думок та цитат" data={analytics?.topNoted} />
            <ChartCard title="Улюблені автори" data={analytics?.topAuthors} />
          </div>

          <Card className="rounded-[2rem] border shadow-sm transition-all">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <History size={16} className="text-primary" /> Остання активність
                </h3>
                <Button variant="ghost" size="sm" className="text-xs text-primary font-bold gap-1" onClick={() => setShowAllActivity(!showAllActivity)}>
                  {showAllActivity ? <><ChevronUp size={14}/> Згорнути</> : <><ChevronDown size={14}/> Вся історія</>}
                </Button>
              </div>
              <div className="divide-y border-t border-b">
                {activity?.map(b => {
                  const s = statusMap[b.status] || { label: b.status, color: 'bg-gray-100' };
                  return (
                    <div key={b.id} className="py-4 flex justify-between items-center group cursor-pointer" onClick={() => navigate(`/books/${b.id}`)}>
                      <div className="text-left">
                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{b.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase">{b.author}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <Badge className={`text-[9px] uppercase border font-bold ${s.color}`}>{s.label}</Badge>
                        <p className="text-[10px] text-muted-foreground">{new Date(b.updatedAt || b.addedDate).toLocaleDateString("uk-UA")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* МОДАЛЬНЕ ВІКНО КАДРУВАННЯ */}
      {showCropper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-background overflow-hidden flex flex-col h-[500px]">
            <div className="relative flex-1 bg-black/10">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1} // Квадратна пропорція (або 1 для кола)
                cropShape="round" // Робить зону обрізки круглою
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-4 space-y-4">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="w-full"
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCropper(false)}>
                  Скасувати
                </Button>
                <Button className="flex-1" onClick={handleSaveCrop}>
                  Застосувати
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ value, label, className = "", icon }) => (
  <div className={`text-center ${className}`}>
    <div className="flex items-center justify-center gap-1.5 mb-1">{icon}<p className="text-3xl font-bold text-primary">{value || 0}</p></div>
    <p className="text-[10px] uppercase font-bold text-muted-foreground leading-tight max-w-[100px] mx-auto">{label}</p>
  </div>
);

const ChartCard = ({ title, data }) => (
  <Card className="rounded-[2rem] border shadow-sm bg-card">
    <CardContent className="p-6 space-y-4">
      <h3 className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground border-b pb-2">{title}</h3>
      <div className="space-y-3">
        {data?.length > 0 ? data.map((item, i) => (
          <div key={i} className="space-y-1 text-left">
            <div className="flex justify-between text-[10px] font-bold uppercase">
              <span className="truncate max-w-[140px]">{item.name}</span>
              <span>{item.count}</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        )) : <p className="text-[10px] italic text-muted-foreground text-center">Немає даних</p>}
      </div>
    </CardContent>
  </Card>
);

export default AccountPage;