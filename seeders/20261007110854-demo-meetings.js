'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('Meetings', [
      {
        id: 1,
        title: 'Планерка отдела разработки',
        date: new Date('2026-10-10T07:00:00.000Z'),
        location: 'Конференц-зал А',
        organizer: 'Иванов И.И.',
        status: 'planned',
        description: 'Обсуждение итогов недели и плана спринта',
        participants: ['Петров П.П.', 'Сидорова А.А.'],
        durationMin: 45,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        title: 'Собрание по курсовому проекту',
        date: new Date('2026-10-03T09:00:00.000Z'),
        location: 'Аудитория 314',
        organizer: 'Петрова М.С.',
        status: 'completed',
        description: 'Защита промежуточных результатов',
        participants: ['Иванов И.И.', 'Кузнецов Д.А.'],
        durationMin: 60,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        title: 'Встреча с заказчиком',
        date: new Date('2026-09-28T11:30:00.000Z'),
        location: 'Онлайн',
        organizer: 'Смирнов А.А.',
        status: 'completed',
        description: 'Согласование требований к системе собраний',
        participants: ['Петрова М.С.', 'Сидорова А.А.'],
        durationMin: 40,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await queryInterface.bulkInsert('Agendas', [
      {
        id: 1,
        meetingId: 1,
        title: 'Повестка планерки 10.10.2026',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        meetingId: 2,
        title: 'Повестка собрания по курсовому проекту',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        meetingId: 3,
        title: 'Повестка встречи с заказчиком',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await queryInterface.bulkInsert('AgendaItems', [
      { agendaId: 1, sortOrder: 1, topic: 'Итоги прошлой недели', speaker: 'Иванов И.И.', durationMin: 15, createdAt: now, updatedAt: now },
      { agendaId: 1, sortOrder: 2, topic: 'План на спринт', speaker: 'Петров П.П.', durationMin: 20, createdAt: now, updatedAt: now },
      { agendaId: 1, sortOrder: 3, topic: 'Блокеры', speaker: 'Сидорова А.А.', durationMin: 10, createdAt: now, updatedAt: now },
      { agendaId: 2, sortOrder: 1, topic: 'Демонстрация API', speaker: 'Кузнецов Д.А.', durationMin: 20, createdAt: now, updatedAt: now },
      { agendaId: 2, sortOrder: 2, topic: 'Замечания руководителя', speaker: 'Петрова М.С.', durationMin: 15, createdAt: now, updatedAt: now },
      { agendaId: 3, sortOrder: 1, topic: 'Цели системы', speaker: 'Смирнов А.А.', durationMin: 15, createdAt: now, updatedAt: now },
      { agendaId: 3, sortOrder: 2, topic: 'Состав данных: встречи, повестки, протоколы', speaker: 'Петрова М.С.', durationMin: 25, createdAt: now, updatedAt: now },
    ]);

    await queryInterface.bulkInsert('Protocols', [
      {
        id: 1,
        meetingId: 2,
        date: new Date('2026-10-03T10:00:00.000Z'),
        secretary: 'Сидорова А.А.',
        attendees: ['Петрова М.С.', 'Иванов И.И.', 'Кузнецов Д.А.'],
        summary: 'Промежуточные результаты приняты, замечания зафиксированы.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        meetingId: 3,
        date: new Date('2026-09-28T12:30:00.000Z'),
        secretary: 'Петрова М.С.',
        attendees: ['Смирнов А.А.', 'Петрова М.С.', 'Сидорова А.А.'],
        summary: 'Требования согласованы, состав предметной области утверждён.',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await queryInterface.bulkInsert('Decisions', [
      {
        protocolId: 1,
        text: 'Доработать обработку ошибок API до следующей встречи',
        responsible: 'Кузнецов Д.А.',
        deadline: '2026-10-10',
        createdAt: now,
        updatedAt: now,
      },
      {
        protocolId: 2,
        text: 'Утвердить три сущности: встреча, повестка, протокол',
        responsible: 'Смирнов А.А.',
        deadline: '2026-10-01',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const tables = ['Meetings', 'Agendas', 'Protocols'];
    for (const table of tables) {
      await queryInterface.sequelize.query(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), (SELECT MAX(id) FROM "${table}"))`,
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      TRUNCATE TABLE "Decisions", "Protocols", "AgendaItems", "Agendas", "Meetings"
      RESTART IDENTITY CASCADE;
    `);
  },
};
