/**
 * @file Сторінка "Про проєкт" застосунку Tracker Books.
 * @description Презентаційний компонент, що описує архітектуру системи,
 * використаний технологічний стек (Full-stack) та перелік
 * функціональних можливостей.
 */
import {
  BookOpen,
  Code,
  Database,
  Globe,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

/**
 * Сторінка "Про проєкт".
 * Описує мету застосунку, використані технології та ключові можливості.
 */
export default function AboutPage() {
  /** * Конфігурація технологічного стека.
   * Розподілена за категоріями для наочності архітектури.
   * @type {Array<{category: string, icon: React.ReactNode, items: string[]}>}
   */
  const techStack = [
    {
      category: "Frontend",
      icon: <Code className="h-5 w-5 text-blue-500" />,
      items: [
        "React 19",
        "React Router 7",
        "Tailwind CSS",
        "Lucide Icons",
        "Axios",
      ],
    },
    {
      category: "Backend",
      icon: <Database className="h-5 w-5 text-green-500" />,
      items: [
        "Django 5",
        "Django REST Framework",
        "JWT Authentication (Djoser)",
        "SQLite",
      ],
    },
    {
      category: "Інструменти",
      icon: <Globe className="h-5 w-5 text-purple-500" />,
      items: [
        "Google Books API", 
        "RESTful API Architecture",
        "GitHub Version Control",
      ],
    },
  ];

  /** * Перелік ключових функцій застосунку.
   * Напряму корелює з функціональними вимогами.
   * @type {string[]}
   */
  const features = [
    "Пошук книг у реальному часі через Google API",
    "Керування особистою бібліотекою",
    "Управління життєвим циклом книги",
    "Розрахунок рівня читацької активності",
    "Персоналізована статистика та річні цілі",
    "Інтерактивний архів нотаток та колекція цитат",
    "Таймер сесій для точного відстеження прогресу",
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
      {/* Секція Hero */}
      <section className="text-center space-y-4 py-8">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4">
          <BookOpen className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Tracker Books
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Твій персональний помічник у світі книг, створений для тих, хто цінує
          кожен прочитаний рядок.
        </p>
      </section>

      {/* Опис проєкту */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Про проєкт
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Tracker Books — інформаційна система обліку прочитаних книжок для персоналізованого моніторингу читацької активності.
            Проєкт розроблено в рамках кваліфікаційної роботи бакалавра зі спеціальності "Комп'ютерні науки" на базі Сумського державного університету.
            Tracker Books — це середовище, яке допомагає зберігати не лише прогрес у сторінках, а й емоції,враження та найвлучніші вислови від кожної книги.
            Застосунок дозволяє користувачам створювати власну бібліотеку, вести нотатки, збирати цитати та аналізувати читацьку активність через інтуїтивно зрозумілий інтерфейс.
          </p>
        </div>

        {/* Список можливостей */}
        <div className="bg-muted/50 rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="font-semibold mb-4">Ключові можливості:</h3>
          <ul className="space-y-3">
            {features.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Стек технологій */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Технологічний стек</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {techStack.map((tech, index) => (
            <Card key={index} className="border-none shadow-md bg-card">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                {tech.icon}
                <CardTitle className="text-lg">{tech.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tech.items.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
