/**
 * @file Допоміжні утиліти для роботи з UI компонентами.
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Об'єднує класи Tailwind CSS, автоматично вирішуючи конфлікти між ними.
 * Використовує бібліотеку clsx для умовних класів та tailwind-merge для правильного злиття.
 *
 * @param {...(string|Object|Array)} inputs - Набір класів для об'єднання (рядки, об'єкти або масиви).
 * @returns {string} Результуючий рядок з оптимізованими класами Tailwind.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
