const mongoose = require('mongoose');

// Вложенный документ (подсхема) решения протокола.
// В реляционной PostgreSQL это была отдельная таблица Decisions.
const decisionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  responsible: {
    type: String,
    default: '',
  },
  deadline: {
    type: String,
    default: '',
  },
});

const protocolSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    secretary: {
      type: String,
      required: true,
      trim: true,
    },
    // Вложенный массив строк: список участников.
    attendees: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: '',
    },
    // Вложенный массив документов: решения хранятся внутри протокола.
    decisions: {
      type: [decisionSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Protocol', protocolSchema);
