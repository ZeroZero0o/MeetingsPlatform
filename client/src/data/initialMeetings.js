export const STORAGE_KEY = 'meetings-app:meetings';

export const STATUS_LABELS = {
  planned: 'Запланирована',
  in_progress: 'В процессе',
  completed: 'Завершена',
  cancelled: 'Отменена',
};

export const STATUSES = Object.keys(STATUS_LABELS);

const initialMeetings = [
  {
    id: 1,
    title: 'Планерка отдела разработки',
    date: '2026-10-10T10:00',
    location: 'Конференц-зал А',
    organizer: 'Иванов И.И.',
    status: 'planned',
    description: 'Обсуждение итогов недели и плана спринта',
    participants: ['Петров П.П.', 'Сидорова А.А.'],
    durationMin: 45,
  },
  {
    id: 2,
    title: 'Собрание по курсовому проекту',
    date: '2026-10-03T09:00',
    location: 'Аудитория 314',
    organizer: 'Петрова М.С.',
    status: 'completed',
    description: 'Защита промежуточных результатов',
    participants: ['Иванов И.И.', 'Кузнецов Д.А.'],
    durationMin: 60,
  },
  {
    id: 3,
    title: 'Встреча с заказчиком',
    date: '2026-09-28T11:30',
    location: 'Онлайн',
    organizer: 'Смирнов А.А.',
    status: 'completed',
    description: 'Согласование требований к системе собраний',
    participants: ['Петрова М.С.', 'Сидорова А.А.'],
    durationMin: 40,
  },
];

export default initialMeetings;
