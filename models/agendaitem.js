'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AgendaItem extends Model {
    static associate(models) {
      AgendaItem.belongsTo(models.Agenda, {
        foreignKey: 'agendaId',
        as: 'agenda',
      });
    }
  }

  AgendaItem.init({
    agendaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sortOrder',
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    speaker: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    durationMin: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'AgendaItem',
  });

  return AgendaItem;
};
