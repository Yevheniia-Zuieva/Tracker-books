import * as React from "react";

import { cn } from "./utils";

/**
 * Основний контейнерний компонент картки.
 * Використовується як базовий блок для відображення книг, статистичних даних
 * та елементів аналітики у застосунку "Tracker Books".
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи для зовнішнього вигляду.
 * @param {React.ReactNode} props.children - Вміст картки.
 * @param {React.HTMLAttributes<HTMLDivElement>} props.props - Стандартні HTML-атрибути div.
 * @returns {React.JSX.Element} Елемент div з базовою стилізацією картки.
 */
function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Верхня частина картки (хедер).
 * Призначена для розміщення заголовка, опису та кнопок швидких дій.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи.
 * @returns {React.JSX.Element}
 */
function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Заголовок картки.
 * Використовується для відображення назви книги або назви розділу статистики.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи.
 * @returns {React.JSX.Element} Елемент h4.
 */
function CardTitle({ className, ...props }) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none", className)}
      {...props}
    />
  );
}

/**
 * Короткий опис або допоміжний текст під заголовком.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи.
 * @returns {React.JSX.Element} Елемент p.
 */
function CardDescription({ className, ...props }) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Контейнер для додаткових дій у хедері картки.
 * Наприклад, кнопки "Редагувати" або іконки "Видалити".
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи.
 * @returns {React.JSX.Element}
 */
function CardAction({ className, ...props }) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Основна область вмісту картки.
 * Призначена для відображення списків, тексту нотаток або графіків статистики.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи.
 * @returns {React.JSX.Element}
 */
function CardContent({ className, ...props }) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 [&:last-child]:pb-6", className)}
      {...props}
    />
  );
}

/**
 * Нижня частина картки (футер).
 * Використовується для додаткової інформації або кнопок завершення сесії читання.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи.
 * @returns {React.JSX.Element}
 */
function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
