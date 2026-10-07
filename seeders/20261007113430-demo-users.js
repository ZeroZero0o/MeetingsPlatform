'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const userHash = await bcrypt.hash('User12345', 10);

    await queryInterface.bulkInsert('Users', [
      {
        id: 1,
        email: 'admin@meetings.local',
        passwordHash: adminHash,
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        email: 'user@meetings.local',
        passwordHash: userHash,
        role: 'user',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), (SELECT MAX(id) FROM "Users"))`,
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', { email: 'admin@meetings.local' });
    await queryInterface.bulkDelete('Users', { email: 'user@meetings.local' });
  },
};
