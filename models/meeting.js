'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Meeting extends Model {
    static associate(models) {
      Meeting.hasMany(models.Agenda, {
        foreignKey: 'meetingId',
        as: 'agendas',
        onDelete: 'CASCADE',
      });
      Meeting.hasMany(models.Protocol, {
        foreignKey: 'meetingId',
        as: 'protocols',
        onDelete: 'CASCADE',
      });
    }
  }

  Meeting.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    organizer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'planned',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    participants: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    durationMin: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Meeting',
  });

  return Meeting;
};
