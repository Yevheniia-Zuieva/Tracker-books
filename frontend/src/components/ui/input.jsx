import * as React from "react";

import { cn } from "./utils";

/**
 * Універсальний компонент текстового поля (Input) для збору даних від користувача.
 * * Використовується як базовий елемент інтерфейсу для реалізації наступних функцій:
 * - Реєстрація користувача (введення імені, email, пароля).
 * - Авторизація (введення облікових даних).
 * - Пошук книг за назвою, автором або іншими критеріями.
 * * Стилізація підтримує стани валідації (через атрибут `aria-invalid`), що важливо для
 * відображення помилок некоректного формату пошти або пароля.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи для кастомізації зовнішнього вигляду.
 * @param {string} [props.type] - Тип поля введення (text, email, password, number тощо).
 * @param {React.InputHTMLAttributes<HTMLInputElement>} props.props - Інші стандартні атрибути HTML-елемента input.
 * @returns {React.JSX.Element} Рендерить стилізований елемент input.
 */
function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
