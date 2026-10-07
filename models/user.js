'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate() {}

    toJSON() {
      const values = { ...super.toJSON() };
      delete values.passwordHash;
      return values;
    }
  }

  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};
