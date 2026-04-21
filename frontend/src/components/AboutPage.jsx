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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

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
        "JWT Auth (Djoser)",
        "SQLite",
      ],
    },
    {
      category: "Інтеграції",
      icon: <Globe className="h-5 w-5 text-purple-500" />,
      items: ["Google Books API", "RESTful API Architecture"],
    },
  ];

  /** * Перелік ключових функцій застосунку.
   * Напряму корелює з функціональними вимогами.
   * @type {string[]}
   */
  const features = [
    "Пошук книг у реальному часі через Google API",
    "Керування особистою бібліотекою та статусами читання",
    "Відстеження прогресу сторінок",
    "Система нотаток та цитат до кожної книги",
    "Детальна статистика читання та річні цілі",
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
            Мета проєкту
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Tracker Books — вебзастосунок, розроблений для зручного обліку
            власної бібліотеки. Він поєднує в собі потужність Django на бекенді
            та гнучкість React на фронтенді, забезпечуючи швидку роботу та
            приємний користувацький досвід.
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
