const express = require('express');
const { Meeting } = require('../../models');
const {
  createError,
  readId,
  assertObject,
  requireText,
  optionalText,
  stringList,
  requireDate,
  optionalPositiveInt,
  asyncHandler,
} = require('../utils/errors');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

const STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatMeeting(meeting) {
  return {
    id: meeting._id.toString(),
    title: meeting.title,
    date: meeting.date,
    location: meeting.location,
    organizer: meeting.organizer,
    participants: meeting.participants || [],
    status: meeting.status,
    description: meeting.description,
    durationMin: meeting.durationMin,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
  };
}

function buildMeeting(body) {
  assertObject(body);

  const status = body.status === undefined ? 'planned' : body.status;
  if (!STATUSES.includes(status)) {
    throw createError(400, `Поле status должно быть одним из: ${STATUSES.join(', ')}`);
  }

  return {
    title: requireText(body.title, 'title'),
    date: requireDate(body.date, 'date'),
    location: optionalText(body.location, 'location'),
    organizer: requireText(body.organizer, 'organizer'),
    participants: stringList(body.participants, 'participants'),
    status,
    description: optionalText(body.description, 'description'),
    durationMin: optionalPositiveInt(body.durationMin, 'durationMin'),
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status !== undefined) {
    if (!STATUSES.includes(req.query.status)) {
      throw createError(400, `Параметр status должен быть одним из: ${STATUSES.join(', ')}`);
    }
    filter.status = req.query.status;
  }

  if (req.query.search !== undefined) {
    const search = String(req.query.search).trim();
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { title: pattern },
        { organizer: pattern },
        { location: pattern },
      ];
    }
  }

  const meetings = await Meeting.find(filter).sort({ date: 1 });
  res.json(meetings.map(formatMeeting));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw createError(404, 'Встреча не найдена');
  }
  res.json(formatMeeting(meeting));
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const meeting = await Meeting.create(buildMeeting(req.body));
  res.status(201).json(formatMeeting(meeting));
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const meeting = await Meeting.findByIdAndUpdate(id, buildMeeting(req.body), {
    new: true,
    runValidators: true,
  });
  if (!meeting) {
    throw createError(404, 'Встреча не найдена');
  }
  res.json(formatMeeting(meeting));
}));

router.delete('/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const meeting = await Meeting.findByIdAndDelete(id);
  if (!meeting) {
    throw createError(404, 'Встреча не найдена');
  }
  res.json({ message: 'Встреча удалена', id });
}));

module.exports = router;
