import * as React from "react";
import { cn } from "./utils";
import { buttonVariants, buttonSizes } from "./button-variants";

/**
 * Універсальний компонент кнопки для інтерфейсу застосунку "Tracker Books".
 * Реалізує гнучке керування стилями та розмірами через пропси.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові користувацькі CSS-класи.
 * @param {'default'|'destructive'|'outline'|'secondary'|'ghost'|'link'} [props.variant='default'] - Візуальний стиль кнопки.
 * @param {'default'|'sm'|'lg'|'icon'} [props.size='default'] - Розмір кнопки.
 * @param {React.ReactNode} props.children - Вміст кнопки (текст, іконки).
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props.props - Стандартні атрибути HTML-кнопки.
 * @param {React.ForwardedRef<HTMLButtonElement>} ref - Посилання на DOM-елемент кнопки.
 * * @returns {React.JSX.Element} Стілізований HTML-елемент button.
 */
const Button = React.forwardRef(
  (
    { className, variant = "default", size = "default", children, ...props },
    ref,
  ) => {
    /** @type {string} Класи, що відповідають обраному візуальному стилю */
    const variantClasses = buttonVariants[variant] || buttonVariants.default;

    /** @type {string} Класи, що відповідають обраному розміру */
    const sizeClasses = buttonSizes[size] || buttonSizes.default;

    /** @type {string} Базові структурні класи, що застосовуються до всіх кнопок */
    const baseClasses =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

    return (
      <button
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
