import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getErrorMessage,
} from '../api.js';

const SEARCH_DEBOUNCE_MS = 400;
const NOTIFICATION_TIMEOUT_MS = 4000;
// ВРЕМЕННО (для скриншота спиннера): искусственная задержка загрузки, мс. Убрать после снятия скриншота.
const ARTIFICIAL_DELAY_MS = 2500;

// Хук инкапсулирует работу со встречами: загрузка списка с сервера,
// состояния loading/error, поиск с debounce и CRUD-операции
// с оптимистичным обновлением и откатом при ошибках.
export default function useMeetings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [notification, setNotification] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const notifyTimer = useRef(null);

  // Debounce ввода в поле поиска (дополнительное улучшение).
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Загрузка списка: на монтирование, при изменении поиска и по кнопке «Повторить».
  // AbortController отменяет запрос при размонтировании/смене поиска.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timer;

    setLoading(true);
    setError(null);

    // ВРЕМЕННО: задерживаем запрос, чтобы был виден индикатор загрузки.
    timer = setTimeout(() => {
      if (!active) return;
      fetchMeetings(debouncedSearch ? { search: debouncedSearch } : {}, controller.signal)
        .then((data) => {
          if (active) setItems(data);
        })
        .catch((err) => {
          if (active && err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
            setError(getErrorMessage(err));
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, ARTIFICIAL_DELAY_MS);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [debouncedSearch, reloadKey]);

  // Автосброс всплывающего уведомления.
  useEffect(() => {
    if (notification) {
      notifyTimer.current = setTimeout(() => setNotification(null), NOTIFICATION_TIMEOUT_MS);
    }
    return () => clearTimeout(notifyTimer.current);
  }, [notification]);

  function notify(message, type = 'error') {
    setNotification({ message, type });
  }

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  // Добавление: оптимистично вставляем элемент с временным ID,
  // при успехе заменяем его данными с сервера, при ошибке убираем.
  async function add(data) {
    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...data, id: tempId, pending: true };
    setItems((prev) => [optimistic, ...prev]);

    try {
      const created = await createMeeting(data);
      setItems((prev) => prev.map((m) => (m.id === tempId ? created : m)));
      notify('Встреча добавлена', 'success');
    } catch (err) {
      setItems((prev) => prev.filter((m) => m.id !== tempId));
      notify(`Не удалось добавить: ${getErrorMessage(err)}`);
    }
  }

  // Удаление: оптимистично убираем элемент, при ошибке возвращаем на место.
  async function remove(id) {
    const index = items.findIndex((m) => m.id === id);
    if (index === -1) return;
    const removed = items[index];

    setItems((prev) => prev.filter((m) => m.id !== id));

    try {
      await deleteMeeting(id);
      notify('Встреча удалена', 'success');
    } catch (err) {
      setItems((prev) => {
        const copy = [...prev];
        copy.splice(Math.min(index, copy.length), 0, removed);
        return copy;
      });
      notify(`Не удалось удалить: ${getErrorMessage(err)}`);
    }
  }

  // Редактирование: оптимистично обновляем элемент, при ошибке откатываем.
  async function edit(id, data) {
    const index = items.findIndex((m) => m.id === id);
    if (index === -1) return;
    const previous = items[index];

    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...data, pending: true } : m)));

    try {
      const updated = await updateMeeting(id, data);
      setItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
      notify('Встреча обновлена', 'success');
    } catch (err) {
      setItems((prev) => prev.map((m) => (m.id === id ? previous : m)));
      notify(`Не удалось обновить: ${getErrorMessage(err)}`);
    }
  }

  return {
    items,
    loading,
    error,
    search,
    setSearch,
    notification,
    reload,
    add,
    remove,
    edit,
  };
}
