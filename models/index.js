const mongoose = require('mongoose');
const User = require('./User');
const Meeting = require('./Meeting');
const Agenda = require('./Agenda');
const Protocol = require('./Protocol');

module.exports = {
  mongoose,
  User,
  Meeting,
  Agenda,
  Protocol,
};
