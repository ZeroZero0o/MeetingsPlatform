const mongoose = require('mongoose');

// Вложенный документ (подсхема) вопроса повестки.
// В реляционной PostgreSQL это была отдельная таблица AgendaItems.
const agendaItemSchema = new mongoose.Schema({
  sortOrder: {
    type: Number,
    required: true,
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  speaker: {
    type: String,
    default: '',
  },
  durationMin: {
    type: Number,
    min: 1,
    default: null,
  },
});

const agendaSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Вложенный массив документов: вопросы повестки хранятся внутри повестки.
    items: {
      type: [agendaItemSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Agenda', agendaSchema);
