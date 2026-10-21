import { useEffect, useState } from 'react';

const DEBOUNCE_MS = 500;

export default function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);

  // Загрузка при монтировании компонента (пустой массив зависимостей)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setStoredValue(JSON.parse(raw));
      }
    } catch (error) {
      console.error('Ошибка чтения из localStorage:', error);
    }
  }, [key]);

  // Автосохранение при каждом изменении с debounce (задержка 500 мс)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error('Ошибка записи в localStorage:', error);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
