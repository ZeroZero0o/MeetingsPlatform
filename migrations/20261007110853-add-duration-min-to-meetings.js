'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Meetings', 'durationMin', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Meetings', 'durationMin');
  },
};
