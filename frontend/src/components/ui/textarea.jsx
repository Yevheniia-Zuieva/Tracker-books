import * as React from "react";
import { cn } from "./utils";

/**
 * Компонент багаторядкового текстового поля (Textarea).
 * * Забезпечує універсальний інтерфейс для введення тексту з підтримкою
 * адаптивної стилізації та станів фокусування. Використовує `React.forwardRef`
 * для забезпечення доступу до базового DOM-елемента.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи для кастомізації зовнішнього вигляду.
 * @param {React.TextareaHTMLAttributes<HTMLTextAreaElement>} props.props - Стандартні атрибути HTML-елемента textarea.
 * @param {React.ForwardedRef<HTMLTextAreaElement>} ref - Посилання на DOM-елемент textarea.
 * @returns {React.JSX.Element} Рендерить стилізований елемент textarea.
 */
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
