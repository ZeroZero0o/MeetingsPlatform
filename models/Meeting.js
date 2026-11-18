const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'completed', 'cancelled'],
      default: 'planned',
    },
    description: {
      type: String,
      default: '',
    },
    // Вложенный массив строк — в реляционной модели потребовалась бы отдельная таблица.
    participants: {
      type: [String],
      default: [],
    },
    durationMin: {
      type: Number,
      min: 1,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Meeting', meetingSchema);
