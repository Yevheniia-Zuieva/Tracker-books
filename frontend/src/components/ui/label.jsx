import * as React from "react";
import { cn } from "./utils";

/**
 * Компонент текстової мітки (Label) для елементів форм застосунку "Tracker Books".
 * * Забезпечує семантичний зв'язок між описом та полями введення (Input, Checkbox), 
 * що є критичним для доступності інтерфейсу та коректної роботи скрінрідерів.
 * * Використовується у наступних модулях системи:
 * - Форми реєстрації та авторизації для позначення полів Email та Пароль.
 * - Редагування профілю користувача (Мета на рік, Статус).
 * - Форма додавання книги вручну (Назва, Автор, Жанр).
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи для коригування стилів.
 * @param {React.ReactNode} props.children - Текстовий вміст або інші елементи всередині мітки.
 * @param {React.LabelHTMLAttributes<HTMLLabelElement>} props.props - Стандартні HTML-атрибути елемента label.
 * @returns {React.JSX.Element} Рендерить стилізований елемент label.
 */
function Label({
  className,
  children, // щоб передавати вміст
  ...props
}) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export { Label };
