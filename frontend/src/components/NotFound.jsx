import React, { useState } from 'react';

/**
 * @component NotFound
 * @description Клієнтський компонент для відображення помилки 404 (Сторінку не знайдено).
 * * Функціональні особливості:
 * 1. Використовується як маршрут за замовчуванням (wildcard) для обробки некоректних URL.
 * 2. Реалізує інтерактивний інтерфейс із використанням React hooks (useState) для обробки станів наведення.
 * 3. Містить блок корисних інструкцій для користувача щодо подальшої навігації.
 * 4. Забезпечує швидке повернення до головного розділу застосунку через програмне посилання.
 * * @returns {JSX.Element} Візуальний інтерфейс сторінки 404.
 */

const NotFound = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={styles.body404}>
      <div style={styles.container}>
        <div style={styles.illustration}>📖🔍</div>
        <h1 style={styles.errorCode}>404</h1>
        
        {/* Виділено жирним за допомогою fontWeight */}
        <h1 style={{...styles.h1, fontWeight: 'bold'}}>Сторінку не знайдено</h1>
        
        <p style={styles.description}>
          Ми обшукали всю бібліотеку, але не змогли знайти сторінку за цією адресою. 
          Можливо, вона була перенесена або видалена.
        </p>

        <div style={styles.instructions}>
          <h2 style={{...styles.instructionsH2, fontWeight: 'bold'}}>Що можна зробити:</h2>
          <ul style={styles.ul}>
            <li style={styles.li}>Перевірте правильність написання URL-адреси в рядку браузера.</li>
            <li style={styles.li}>Спробуйте оновити сторінку або зачекайте кілька хвилин.</li>
            <li style={styles.li}>Скористайтеся головним меню для пошуку потрібного розділу.</li>
          </ul>
        </div>

        <a 
          href="/" 
          style={{
            ...styles.btn404,
            ...(isHovered ? styles.btnHover : {})
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Повернутися до бібліотеки
        </a>

        <div style={styles.support}>
          Ви впевнені, що це помилка системи? <br /> 
          Повідомте нам: <a href="mailto:support@trackerbooks.com" style={styles.supportA}>support@trackerbooks.com</a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  body404: { 
    fontFamily: "'Inter', sans-serif", 
    backgroundColor: '#f8fafc', 
    color: '#1e293b', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh', 
    margin: 0, 
    width: '100vw' 
  },
  container: { 
    textAlign: 'center', 
    padding: '2rem', 
    maxWidth: '600px', 
    background: 'white', 
    borderRadius: '20px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)' 
  },
  errorCode: { 
    fontSize: '6rem', 
    fontWeight: '800', 
    color: '#6366f1', 
    margin: 0, 
    lineHeight: 1, 
    opacity: 0.2 
  },
  h1: { 
    fontSize: '1.8rem', 
    marginTop: '-1rem', 
    color: '#1e293b' 
  },
  description: { 
    color: '#475569', 
    fontSize: '1.1rem', 
    lineHeight: '1.6', 
    marginBottom: '1.5rem' 
  },
  instructions: { 
    background: '#f1f5f9', 
    padding: '1.5rem', 
    borderRadius: '12px', 
    textAlign: 'left', 
    margin: '1.5rem 0', 
    borderLeft: '4px solid #6366f1' 
  },
  instructionsH2: { 
    fontSize: '1rem', 
    marginTop: 0, 
    color: '#1e293b', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em' 
  },
  ul: { 
    margin: 0, 
    paddingLeft: '1.5rem', 
    color: '#64748b', 
    fontSize: '0.95rem',
    listStyleType: 'disc' 
  },
  li: { 
    marginBottom: '0.5rem',
    display: 'list-item' 
  },
  illustration: { 
    fontSize: '4rem', 
    marginBottom: '1rem' 
  },
  btn404: { 
    display: 'inline-block', 
    backgroundColor: '#6366f1', 
    color: 'white', 
    padding: '0.8rem 2rem', 
    borderRadius: '10px', 
    textDecoration: 'none', 
    fontWeight: '600', 
    marginTop: '1rem', 
    boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)',
    transition: 'all 0.3s ease'
  },
  btnHover: {
    backgroundColor: '#4f46e5',
    transform: 'translateY(-2px)'
  },
  support: { 
    marginTop: '2rem', 
    fontSize: '0.85rem', 
    color: '#94a3b8', 
    borderTop: '1px solid #f1f5f9', 
    paddingTop: '1.5rem' 
  },
  supportA: { 
    color: '#6366f1', 
    textDecoration: 'none', 
    fontWeight: '500' 
  }
};

export default NotFound;