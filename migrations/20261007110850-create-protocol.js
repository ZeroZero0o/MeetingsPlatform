'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Protocols', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      meetingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Meetings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      secretary: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      attendees: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: Sequelize.literal("'{}'"),
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false,
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

    await queryInterface.addIndex('Protocols', ['meetingId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Protocols');
  },
};
