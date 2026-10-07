'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AgendaItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      agendaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Agendas',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      topic: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      speaker: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      },
      durationMin: {
        type: Sequelize.INTEGER,
        allowNull: true,
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

    await queryInterface.addIndex('AgendaItems', ['agendaId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('AgendaItems');
  },
};
