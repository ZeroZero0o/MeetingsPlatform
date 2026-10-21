import { useState } from 'react';
import { STATUSES, STATUS_LABELS } from '../data/initialMeetings.js';

function toFormValues(meeting) {
  return {
    title: meeting?.title ?? '',
    date: meeting?.date ?? '',
    location: meeting?.location ?? '',
    organizer: meeting?.organizer ?? '',
    status: meeting?.status ?? 'planned',
    description: meeting?.description ?? '',
    participants: meeting?.participants?.length ? meeting.participants.join(', ') : '',
    durationMin: meeting?.durationMin != null ? String(meeting.durationMin) : '',
  };
}

export default function MeetingForm({ initial, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(initial));
  const isEditing = Boolean(initial);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const participants = values.participants
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    onSubmit({
      title: values.title.trim(),
      date: values.date,
      location: values.location.trim(),
      organizer: values.organizer.trim(),
      status: values.status,
      description: values.description.trim(),
      participants,
      durationMin: values.durationMin === '' ? null : Number(values.durationMin),
    });
  }

  return (
    <form className="meeting-form" onSubmit={handleSubmit}>
      <h2>{isEditing ? 'Редактировать встречу' : 'Добавить встречу'}</h2>
      <div className="form-grid">
        <label>
          Название *
          <input name="title" value={values.title} onChange={handleChange} required />
        </label>
        <label>
          Дата и время *
          <input type="datetime-local" name="date" value={values.date} onChange={handleChange} required />
        </label>
        <label>
          Место
          <input name="location" value={values.location} onChange={handleChange} />
        </label>
        <label>
          Организатор *
          <input name="organizer" value={values.organizer} onChange={handleChange} required />
        </label>
        <label>
          Статус
          <select name="status" value={values.status} onChange={handleChange}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Длительность (мин)
          <input type="number" min="1" name="durationMin" value={values.durationMin} onChange={handleChange} />
        </label>
        <label className="full">
          Участники (через запятую)
          <input
            name="participants"
            value={values.participants}
            onChange={handleChange}
            placeholder="Иванов И.И., Петров П.П."
          />
        </label>
        <label className="full">
          Описание
          <textarea name="description" value={values.description} onChange={handleChange} rows={3} />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit">{isEditing ? 'Сохранить' : 'Добавить'}</button>
        {isEditing && (
          <button type="button" className="button-secondary" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
