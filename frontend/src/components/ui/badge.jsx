import * as React from "react";
import { cn } from "./utils";
import { badgeVariants } from "./badge-variants";

/**
 * Компонент Badge (значок) для візуального позначення статусів, категорій або тегів.
 * * @component
 * * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS класи для кастомізації.
 * @param {'default'|'secondary'|'destructive'|'outline'} [props.variant='default'] - Візуальний стиль компонента.
 * @param {React.HTMLAttributes<HTMLDivElement>} props.props - Інші стандартні HTML-атрибути для елемента div.
 * * @returns {React.JSX.Element} Рендерить елемент div зі стилізованим бейджем.
 */
function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
