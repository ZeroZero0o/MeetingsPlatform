import { useEffect, useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.js';
import initialMeetings, { STATUSES, STATUS_LABELS, STORAGE_KEY } from '../data/initialMeetings.js';
import MeetingForm from './MeetingForm.jsx';
import MeetingItem from './MeetingItem.jsx';

const SORT_OPTIONS = [
  { value: 'date-asc', label: 'По дате (сначала ближайшие)' },
  { value: 'date-desc', label: 'По дате (сначала поздние)' },
  { value: 'title', label: 'По названию' },
  { value: 'duration-desc', label: 'По длительности (убыв.)' },
];

export default function MeetingList() {
  const [items, setItems] = useLocalStorage(STORAGE_KEY, initialMeetings);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date-asc');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  // Имитация загрузки с сервера (задержка 1 секунда)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Изменение заголовка страницы в зависимости от количества встреч
  useEffect(() => {
    document.title = `Встречи (${items.length}) — Система собраний`;
    return () => {
      document.title = 'Система собраний';
    };
  }, [items.length]);

  const visible = useMemo(() => {
    const filtered = filter === 'all' ? items : items.filter((m) => m.status === filter);
    const sorted = [...filtered];
    switch (sort) {
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
        break;
      case 'duration-desc':
        sorted.sort((a, b) => (b.durationMin || 0) - (a.durationMin || 0));
        break;
      default:
        break;
    }
    return sorted;
  }, [items, filter, sort]);

  const stats = useMemo(() => {
    const byStatus = { all: items.length };
    for (const status of STATUSES) {
      byStatus[status] = items.filter((m) => m.status === status).length;
    }
    const totalDuration = items.reduce((sum, m) => sum + (m.durationMin || 0), 0);
    return { byStatus, totalDuration };
  }, [items]);

  function handleSubmit(data) {
    if (editing) {
      setItems((prev) => prev.map((m) => (m.id === editing.id ? { ...m, ...data } : m)));
      setEditing(null);
    } else {
      const nextId = items.length ? Math.max(...items.map((m) => m.id)) + 1 : 1;
      setItems((prev) => [...prev, { ...data, id: nextId }]);
    }
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((m) => m.id !== id));
    if (editing?.id === id) {
      setEditing(null);
    }
  }

  function handleEdit(meeting) {
    setEditing(meeting);
  }

  if (loading) {
    return <div className="loading">Загрузка встреч…</div>;
  }

  return (
    <section className="meeting-list">
      <div className="controls">
        <label>
          Фильтр по статусу:
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Все</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Сортировка:
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stats">
        <span>Всего: {stats.byStatus.all}</span>
        {STATUSES.map((status) => (
          <span key={status}>
            {STATUS_LABELS[status]}: {stats.byStatus[status]}
          </span>
        ))}
        <span>Суммарно: {stats.totalDuration} мин</span>
      </div>

      <MeetingForm
        key={editing ? editing.id : 'new'}
        initial={editing}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />

      {visible.length === 0 ? (
        <p className="empty">Нет встреч, соответствующих выбранному фильтру.</p>
      ) : (
        <ul className="meetings">
          {visible.map((meeting) => (
            <MeetingItem
              key={meeting.id}
              meeting={meeting}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
