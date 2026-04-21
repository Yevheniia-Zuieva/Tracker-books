/**
 * @file Сторінка підтримки та допомоги користувачам застосунку "Tracker Books".
 * @description Компонент містить базу знань (FAQ), короткі інструкції щодо ключового
 * функціоналу (пошук, бібліотека, статистика) та інтерактивну форму для відправки
 * відгуків або повідомлень про помилки до адміністрації.
 */
import { useState } from "react";
import {
  HelpCircle,
  BookPlus,
  Search,
  BarChart3,
  MessageCircle,
  Info,
  Send,
  X,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { apiFeedback } from "../api/ApiService";

/**
 * Компонент HelpPage.
 * * Функціональні аспекти:
 * - Навігація по часим запитанням (FAQ).
 * - Ознайомлення з основними модулями системи.
 * - Відправка зворотного зв'язку через API.
 * * @component
 * @returns {React.JSX.Element} Сторінка допомоги з формою зворотного зв'язку.
 */
export default function HelpPage() {
  /**
 * Стан видимості форми відгуку
 * @type {boolean}
 */
  const [isFormOpen, setIsFormOpen] = useState(false);

  /**
 * Текст повідомлення від користувача
 * @type {string}
 */
  const [message, setMessage] = useState("");

  /**
 * Стан процесу відправки даних на сервер
 * @type {boolean}
 */
  const [isSending, setIsSending] = useState(false);

  /**
   * Масив об'єктів Частих Запитань.
   * Охоплює базові сценарії взаємодії з трекером.
   * @type {Array<{question: string, answer: string}>}
   */
  const faqs = [
    {
      question: "Як додати нову книгу?",
      answer:
        "Ви можете скористатися пошуком через Google Books на сторінці 'Пошук книг' або додати дані вручну, натиснувши кнопку 'Додати книгу вручну'.",
    },
    {
      question: "Як відстежувати прогрес читання?",
      answer:
        "На картці книги в бібліотеці натисніть кнопку статусу. Після того, як статус зміниться на 'Читаю', ви зможете оновлювати кількість прочитаних сторінок.",
    },
    {
      question: "Чи можна видалити книгу з бібліотеки?",
      answer:
        "Так, у детальному перегляді кожної книги або безпосередньо на картці (для книг, доданих вручну) є можливість видалення запису.",
    },
  ];

  /**
   * Обробник відправки повідомлення розробнику.
   * Використовує сервіс apiFeedback для взаємодії з бекендом.
   * @async
   * @function handleSendFeedback
   */
  const handleSendFeedback = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await apiFeedback.sendFeedback(message);
      alert("Дякуємо! Ваш відгук надіслано розробнику.");
      setMessage("");
      setIsFormOpen(false);
    } catch (error) {
      console.error("Помилка відправки:", error);
      alert("Не вдалося надіслати відгук. Спробуйте пізніше.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
      {/* Заголовок */}
      <section className="text-center space-y-4 py-8">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4">
          <HelpCircle className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">
          Допомога та підтримка
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Все що вам потрібно знати для комфортної роботи з вашою
          онлайн-бібліотекою.
        </p>
      </section>

      {/* Швидкі інструкції */}
      <section className="grid sm:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-card">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Search className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Пошук</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Знаходьте мільйони книг за назвою, автором або жанром за допомогою
            інтеграції з Google API. Використовуйте фільтрування та сортування
            для швидкого пошуку ідеальної книги.
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <BookPlus className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Бібліотека</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Організовуйте свої книги за статусами: "Хочу прочитати", "Читаю" або
            "Прочитано".
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">Статистика</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Аналізуйте свою активність та слідкуйте за виконанням річної мети
            читання.
          </CardContent>
        </Card>
      </section>

      {/* Часті запитання */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Info className="h-6 w-6 text-primary" />
          Часті запитання
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-5 bg-muted/30 rounded-xl border border-border"
            >
              <h3 className="font-semibold text-foreground mb-2">
                {faq.question}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Контакти та форма зворотного зв'язку*/}
      <section className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
        {!isFormOpen ? (
          <div className="text-center space-y-4">
            <MessageCircle className="h-8 w-8 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Залишилися питання?</h2>
            <p className="text-muted-foreground mb-6">
              Якщо ви знайшли помилку або маєте пропозиції щодо покращення,
              звертайтеся до розробника.
            </p>
            <Button onClick={() => setIsFormOpen(true)} className="px-8">
              Надіслати відгук
            </Button>
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Ваш відгук</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFormOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Textarea
              placeholder="Опишіть вашу пропозицію або помилку..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] bg-background"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSending}
              >
                Скасувати
              </Button>
              <Button
                onClick={handleSendFeedback}
                disabled={isSending || !message.trim()}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Відправити
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
