'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Agenda extends Model {
    static associate(models) {
      Agenda.belongsTo(models.Meeting, {
        foreignKey: 'meetingId',
        as: 'meeting',
      });
      Agenda.hasMany(models.AgendaItem, {
        foreignKey: 'agendaId',
        as: 'items',
        onDelete: 'CASCADE',
      });
    }
  }

  Agenda.init({
    meetingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Agenda',
  });

  return Agenda;
};
