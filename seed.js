require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User, Meeting, Agenda, Protocol } = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/meetings';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB подключена для заполнения демо-данными');

  // --- Пользователи ---
  const adminHash = await bcrypt.hash('Admin123!', 10);
  const userHash = await bcrypt.hash('User12345', 10);

  await User.findOneAndUpdate(
    { email: 'admin@meetings.local' },
    { $setOnInsert: { email: 'admin@meetings.local', passwordHash: adminHash, role: 'admin' } },
    { upsert: true },
  );
  await User.findOneAndUpdate(
    { email: 'user@meetings.local' },
    { $setOnInsert: { email: 'user@meetings.local', passwordHash: userHash, role: 'user' } },
    { upsert: true },
  );

  // --- Встречи ---
  const meetings = [
    {
      title: 'Планерка отдела разработки',
      date: new Date('2026-10-10T07:00:00.000Z'),
      location: 'Конференц-зал А',
      organizer: 'Иванов И.И.',
      status: 'planned',
      description: 'Обсуждение итогов недели и плана спринта',
      participants: ['Петров П.П.', 'Сидорова А.А.'],
      durationMin: 45,
    },
    {
      title: 'Собрание по курсовому проекту',
      date: new Date('2026-10-03T09:00:00.000Z'),
      location: 'Аудитория 314',
      organizer: 'Петрова М.С.',
      status: 'completed',
      description: 'Защита промежуточных результатов',
      participants: ['Иванов И.И.', 'Кузнецов Д.А.'],
      durationMin: 60,
    },
    {
      title: 'Встреча с заказчиком',
      date: new Date('2026-09-28T11:30:00.000Z'),
      location: 'Онлайн',
      organizer: 'Смирнов А.А.',
      status: 'completed',
      description: 'Согласование требований к системе собраний',
      participants: ['Петрова М.С.', 'Сидорова А.А.'],
      durationMin: 40,
    },
  ];

  const meetingIds = {};
  for (const meeting of meetings) {
    const doc = await Meeting.findOneAndUpdate(
      { title: meeting.title },
      { $setOnInsert: meeting },
      { upsert: true, new: true },
    );
    meetingIds[meeting.title] = doc._id;
  }

  // --- Повестки с вложенными вопросами ---
  const agendas = [
    {
      title: 'Повестка планерки 10.10.2026',
      meeting: 'Планерка отдела разработки',
      items: [
        { sortOrder: 1, topic: 'Итоги прошлой недели', speaker: 'Иванов И.И.', durationMin: 15 },
        { sortOrder: 2, topic: 'План на спринт', speaker: 'Петров П.П.', durationMin: 20 },
        { sortOrder: 3, topic: 'Блокеры', speaker: 'Сидорова А.А.', durationMin: 10 },
      ],
    },
    {
      title: 'Повестка собрания по курсовому проекту',
      meeting: 'Собрание по курсовому проекту',
      items: [
        { sortOrder: 1, topic: 'Демонстрация API', speaker: 'Кузнецов Д.А.', durationMin: 20 },
        { sortOrder: 2, topic: 'Замечания руководителя', speaker: 'Петрова М.С.', durationMin: 15 },
      ],
    },
    {
      title: 'Повестка встречи с заказчиком',
      meeting: 'Встреча с заказчиком',
      items: [
        { sortOrder: 1, topic: 'Цели системы', speaker: 'Смирнов А.А.', durationMin: 15 },
        { sortOrder: 2, topic: 'Состав данных: встречи, повестки, протоколы', speaker: 'Петрова М.С.', durationMin: 25 },
      ],
    },
  ];

  for (const agenda of agendas) {
    await Agenda.findOneAndUpdate(
      { title: agenda.title },
      {
        $setOnInsert: {
          meetingId: meetingIds[agenda.meeting],
          title: agenda.title,
          items: agenda.items,
        },
      },
      { upsert: true },
    );
  }

  // --- Протоколы с вложенными решениями ---
  const protocols = [
    {
      meeting: 'Собрание по курсовому проекту',
      date: new Date('2026-10-03T10:00:00.000Z'),
      secretary: 'Сидорова А.А.',
      attendees: ['Петрова М.С.', 'Иванов И.И.', 'Кузнецов Д.А.'],
      summary: 'Промежуточные результаты приняты, замечания зафиксированы.',
      decisions: [
        {
          text: 'Доработать обработку ошибок API до следующей встречи',
          responsible: 'Кузнецов Д.А.',
          deadline: '2026-10-10',
        },
      ],
    },
    {
      meeting: 'Встреча с заказчиком',
      date: new Date('2026-09-28T12:30:00.000Z'),
      secretary: 'Петрова М.С.',
      attendees: ['Смирнов А.А.', 'Петрова М.С.', 'Сидорова А.А.'],
      summary: 'Требования согласованы, состав предметной области утверждён.',
      decisions: [
        {
          text: 'Утвердить три сущности: встреча, повестка, протокол',
          responsible: 'Смирнов А.А.',
          deadline: '2026-10-01',
        },
      ],
    },
  ];

  for (const protocol of protocols) {
    await Protocol.findOneAndUpdate(
      {
        meetingId: meetingIds[protocol.meeting],
        date: protocol.date,
      },
      {
        $setOnInsert: {
          meetingId: meetingIds[protocol.meeting],
          date: protocol.date,
          secretary: protocol.secretary,
          attendees: protocol.attendees,
          summary: protocol.summary,
          decisions: protocol.decisions,
        },
      },
      { upsert: true },
    );
  }

  await mongoose.disconnect();
  console.log('Демо-данные записаны в MongoDB');
}

seed().catch((error) => {
  console.error('Ошибка заполнения MongoDB:', error.message);
  process.exit(1);
});
