'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Decision extends Model {
    static associate(models) {
      Decision.belongsTo(models.Protocol, {
        foreignKey: 'protocolId',
        as: 'protocol',
      });
    }
  }

  Decision.init({
    protocolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    responsible: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Decision',
  });

  return Decision;
};
