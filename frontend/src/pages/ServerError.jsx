/**
 * @file Сторінка повідомлення про критичну помилку сервера (HTTP 500).
 * @description Компонент-заглушка, що активується інтерцептором API при отриманні
 * статусу 500. Призначений для інформування користувача про внутрішні збої системи
 * та надання унікального ідентифікатора інциденту для служби підтримки.
 */

import React from "react";
import { useLocation } from "react-router-dom";

/**
 * @component ServerError
 * @description Компонент сторінки критичної помилки сервера (HTTP 500).
 * * Функціональні особливості:
 * 1. Динамічно вилучає ідентифікатор помилки (errorId) з URL-параметрів запиту.
 * 2. Відображає дружній інтерфейс користувача з інструкціями щодо подальших дій.
 * 3. Надає контактні дані технічної підтримки для передачі коду інциденту.
 * * @returns {JSX.Element} Візуальний інтерфейс сторінки помилки 500.
 */

const ServerError = () => {
  /**
 * Об'єкт поточного стану маршруту
 * @type {Object}
 */
  const location = useLocation();

  /**
   * Парсер параметрів запиту
   * @type {Object}
   */
  const params = new URLSearchParams(location.search);

  /**
   * Унікальний код помилки
   * @type {string}
   */
  const errorId = params.get("id") || "SERVER_ERR";

  return (
    <div style={styles.body500}>
      <div style={styles.container}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛠️💥</div>
        <h1 style={styles.h1}>Виникла внутрішня помилка</h1>
        <p style={styles.p}>
          Наші алгоритми вже зафіксували проблему. Спробуйте оновити сторінку
          через кілька хвилин.
        </p>

        {/* Блок відображення технічного ідентифікатора інциденту */}
        <div style={styles.errorIdBox}>
          <div style={styles.errorIdLabel}>Код інциденту</div>
          <div style={styles.errorIdValue}>{errorId}</div>
        </div>

        <p style={styles.supportText}>
          Якщо проблема не зникає, надішліть цей код на <br />
          <strong>y.zuyeva@student.sumdu.edu.ua</strong>
        </p>
        <a href="/" style={styles.btn500}>
          На головну
        </a>
      </div>
    </div>
  );
};

/**
 * Об'єкт інлайнових стилів для сторінки помилки.
 * Використовує палітру кольорів, що сигналізує про критичний стан (червоні та сланцеві відтінки).
 * @type {Object.<string, React.CSSProperties>}
 */
const styles = {
  body500: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#fff1f2",
    color: "#991b1b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    margin: 0,
    width: "100vw",
  },
  container: {
    background: "white",
    padding: "3rem",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    textAlign: "center",
    maxWidth: "550px",
    borderTop: "5px solid #ef4444",
  },
  h1: { fontSize: "1.8rem", color: "#1e293b", marginBottom: "1rem" },
  p: { color: "#475569", lineHeight: "1.6" },
  errorIdBox: {
    background: "#f1f5f9",
    padding: "1rem",
    borderRadius: "8px",
    margin: "1.5rem 0",
    border: "1px dashed #cbd5e1",
  },
  errorIdLabel: {
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#64748b",
  },
  errorIdValue: {
    fontFamily: "monospace",
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#ef4444",
  },
  supportText: { fontSize: "0.9rem", color: "#64748b", marginTop: "2rem" },
  btn500: {
    display: "inline-block",
    backgroundColor: "#1e293b",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "500",
  },
};

export default ServerError;
