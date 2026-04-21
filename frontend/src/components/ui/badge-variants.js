import { cva } from "class-variance-authority";

/**
 * Конфігурація стилів для компонента Badge за допомогою class-variance-authority.
 * Визначає базові класи та варіації (variants) для різних станів бейджа.
 * * @type {Function}
 * @param {Object} props - Набір параметрів для генерації класів.
 * @param {string} [props.variant] - Стиль бейджа: 'default', 'secondary', 'destructive', 'outline'.
 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
