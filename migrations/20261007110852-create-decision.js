'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Decisions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      protocolId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Protocols',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      responsible: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      },
      deadline: {
        type: Sequelize.DATEONLY,
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

    await queryInterface.addIndex('Decisions', ['protocolId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Decisions');
  },
};
