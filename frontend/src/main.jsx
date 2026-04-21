/**
 * @file Точка входу (Entry Point) клієнтської частини застосунку "Tracker Books".
 * @description Модуль відповідає за ініціалізацію React-оточення, підключення глобальних
 * стилів та монтування кореневого компонента застосунку в DOM-структуру HTML-документа.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

/**
 * Ініціалізація та рендеринг застосунку.
 * * Процес включає:
 * 1. Пошук кореневого елемента з ID 'root' у шаблоні `index.html`.
 * 2. Створення Virtual DOM кореня за допомогою `createRoot`.
 * 3. Активацію `StrictMode` для додаткової перевірки потенційних проблем у коді розробки.
 * 4. Запуск головного компонента `App`, який керує маршрутизацією та автентифікацією (R1.2).
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
