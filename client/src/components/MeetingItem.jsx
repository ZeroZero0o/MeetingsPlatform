import { STATUS_LABELS } from '../data/initialMeetings.js';
import { formatDate } from '../utils/format.js';

export default function MeetingItem({ meeting, onEdit, onDelete }) {
  const isPending = Boolean(meeting.pending);

  return (
    <li className={`meeting-item${isPending ? ' meeting-item-pending' : ''}`}>
      <div className="meeting-head">
        <h3>{meeting.title}</h3>
        <div className="meeting-head-right">
          {isPending && <span className="pending-badge">Сохранение…</span>}
          <span className={`status status-${meeting.status}`}>
            {STATUS_LABELS[meeting.status] ?? meeting.status}
          </span>
        </div>
      </div>
      <div className="meeting-meta">
        <span>Дата: {formatDate(meeting.date)}</span>
        <span>Место: {meeting.location || '—'}</span>
        <span>Организатор: {meeting.organizer}</span>
        {meeting.durationMin != null && <span>Длительность: {meeting.durationMin} мин</span>}
      </div>
      {meeting.participants?.length > 0 && (
        <p className="meeting-participants">Участники: {meeting.participants.join(', ')}</p>
      )}
      {meeting.description && <p className="meeting-description">{meeting.description}</p>}
      <div className="meeting-actions">
        <button onClick={() => onEdit(meeting)} disabled={isPending}>
          Редактировать
        </button>
        <button className="button-danger" onClick={() => onDelete(meeting.id)} disabled={isPending}>
          Удалить
        </button>
      </div>
    </li>
  );
}
