/**
 * Конфігурація візуальних варіантів для компонента Button.
 * Визначає набори CSS-класів для різних стилів відображення (default, destructive тощо).
 * @type {Object.<string, string>}
 */
export const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
  outline:
    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline px-0",
};

/**
 * Конфігурація розмірної сітки для компонента Button.
 * Визначає висоту, відступи та радіуси заокруглення для різних розмірів.
 * @type {Object.<string, string>}
 */
export const buttonSizes = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
};
