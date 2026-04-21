import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";

/**
 * Компонент зображення з механізмом обробки помилок завантаження.
 * * Забезпечує відказостійкість інтерфейсу при відображенні обкладинок книг, 
 * завантажених із зовнішніх джерел (наприклад, Google Books API). 
 * Якщо основне зображення не вдається завантажити, компонент автоматично 
 * перемикається на резервне посилання або відображає стандартну іконку-заглушку.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} props.src - Основне джерело зображення (URL).
 * @param {string} props.alt - Альтернативний текст для доступності та SEO.
 * @param {string} [props.fallbackSrc] - Резервний URL зображення, що використовується при помилці завантаження основного.
 * @param {string} [props.className] - Додаткові CSS-класи для стилізації контейнера або зображення.
 * @param {React.ImgHTMLAttributes<HTMLImageElement>} props.props - Інші стандартні атрибути елемента img.
 * * @returns {React.JSX.Element} Рендерить стилізоване зображення або блок-заглушку з іконкою.
 */
export const ImageWithFallback = ({
  src,
  alt,
  fallbackSrc,
  className,
  ...props
}) => {
  /** @type {[string|undefined, Function]} Стан поточного джерела зображення */
  const [imgSrc, setImgSrc] = useState(src);

  /** @type {[boolean, Function]} Стан наявності критичної помилки завантаження */
  const [hasError, setHasError] = useState(false);

  /**
   * Синхронізує внутрішній стан при зміні вхідного пропса src.
   * Дозволяє коректно оновлювати зображення при перемиканні між книгами в бібліотеці.
   */
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  /** Відображення іконки-заглушки при відсутності зображення або помилці без резервного варіанту */
  if (hasError || !imgSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
      >
        <BookOpen className="w-8 h-8 opacity-50" />
      </div>
    );
  }

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      /**
       * Обробник помилки завантаження.
       * Намагається встановити fallbackSrc, якщо він наданий, інакше активує стан помилки.
       */
      onError={() => {
        if (fallbackSrc) {
          setImgSrc(fallbackSrc);
        } else {
          setHasError(true);
        }
      }}
    />
  );
};
