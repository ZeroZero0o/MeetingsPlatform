import { useEffect, useMemo, useState } from 'react';
import { STATUSES, STATUS_LABELS } from '../data/initialMeetings.js';
import useMeetings from '../hooks/useMeetings.js';
import MeetingForm from './MeetingForm.jsx';
import MeetingItem from './MeetingItem.jsx';

const SORT_OPTIONS = [
  { value: 'date-asc', label: 'По дате (сначала ближайшие)' },
  { value: 'date-desc', label: 'По дате (сначала поздние)' },
  { value: 'title', label: 'По названию' },
  { value: 'duration-desc', label: 'По длительности (убыв.)' },
];

export default function MeetingList() {
  const {
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
  } = useMeetings();

  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date-asc');
  const [editing, setEditing] = useState(null);

  // Изменение заголовка страницы в зависимости от количества встреч.
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
      const id = editing.id;
      edit(id, data);
      setEditing(null);
    } else {
      add(data);
    }
  }

  function handleDelete(id) {
    remove(id);
    if (editing?.id === id) {
      setEditing(null);
    }
  }

  // Первичная загрузка — полностраничный индикатор.
  if (loading && items.length === 0) {
    return <div className="loading">Загрузка встреч…</div>;
  }

  // Ошибка при первичной загрузке — сообщение и кнопка «Повторить».
  if (error && items.length === 0) {
    return (
      <div className="error-banner">
        <p>Не удалось загрузить встречи: {error}</p>
        <button type="button" onClick={reload}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <section className="meeting-list">
      <div className="controls">
        <label className="search-field">
          Поиск:
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Название, организатор, место…"
          />
          {loading && <span className="search-hint">Загрузка…</span>}
        </label>
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

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button type="button" onClick={reload}>
            Повторить
          </button>
        </div>
      )}

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
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </section>
  );
}
