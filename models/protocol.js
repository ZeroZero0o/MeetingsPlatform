'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Protocol extends Model {
    static associate(models) {
      Protocol.belongsTo(models.Meeting, {
        foreignKey: 'meetingId',
        as: 'meeting',
      });
      Protocol.hasMany(models.Decision, {
        foreignKey: 'protocolId',
        as: 'decisions',
        onDelete: 'CASCADE',
      });
    }
  }

  Protocol.init({
    meetingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    secretary: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    attendees: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Protocol',
  });

  return Protocol;
};
