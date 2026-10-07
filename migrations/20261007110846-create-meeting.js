'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Meetings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      },
      organizer: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'planned',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      participants: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: Sequelize.literal("'{}'"),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Meetings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Meetings_status";');
  },
};
