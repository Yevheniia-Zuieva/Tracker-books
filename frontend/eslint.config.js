/**
 * @file Конфігурація статичного аналізатора коду ESLint.
 * @description Цей файл визначає правила перевірки коду для проєкту "Tracker Books".
 * Налаштування забезпечують дотримання стандартів JavaScript/TypeScript, коректну роботу
 * React Hooks та підтримку механізму Fast Refresh у середовищі Vite.
 */

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/**
 * Експорт конфігурації ESLint.
 * Використовує `tseslint.config` для забезпечення типізованого налаштування.
 */
export default tseslint.config(
  /** * Глобальні ігнорування.
   * ESLint не буде перевіряти файли у папці dist (результати збірки).
   */
  { ignores: ["dist"] },
  {
    /** * Базові конфігурації.
     * Об'єднує рекомендовані правила JavaScript та TypeScript.
     */
    extends: [js.configs.recommended, ...tseslint.configs.recommended],

    /** Визначає типи файлів, до яких застосовуються ці правила. */
    files: ["**/*.{ts,tsx,js,jsx}"],

    /** Налаштування оточення та версії мови. */
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser, // Дозволяє використання глобальних об'єктів браузера (window, document)
    },

    /** Підключені плагіни для розширення функціоналу перевірок. */
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    /** * Специфічні правила проєкту.
     * Впливають на стабільність роботи та чистоту коду.
     */
    rules: {
      /** Перевірка правил використання React Hooks (напр. порядок виклику). */
      ...reactHooks.configs.recommended.rules,

      /** * Правило для Fast Refresh.
       * Вимагає, щоб файли експортували лише React-компоненти.
       * Це важливо для коректного оновлення сторінок без перезавантаження у Vite.
       */
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      /** * Запобігання захаращенню коду.
       * Попереджає про наявність оголошених, але не використаних змінних.
       */
      "no-unused-vars": "warn",
    },
  },
);
