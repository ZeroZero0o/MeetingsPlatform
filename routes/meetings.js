const express = require('express');
const { Op } = require('sequelize');
const { Meeting, Agenda, Protocol } = require('../models');
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

function formatMeeting(meeting) {
  return {
    id: meeting.id,
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
  const where = {};

  if (req.query.status !== undefined) {
    if (!STATUSES.includes(req.query.status)) {
      throw createError(400, `Параметр status должен быть одним из: ${STATUSES.join(', ')}`);
    }
    where.status = req.query.status;
  }

  if (req.query.organizer !== undefined) {
    const organizer = String(req.query.organizer).trim();
    if (!organizer) {
      throw createError(400, 'Параметр organizer не должен быть пустым');
    }
    const pattern = `%${organizer.replace(/[\\%_]/g, '\\$&')}%`;
    where.organizer = { [Op.iLike]: pattern };
  }

  const meetings = await Meeting.findAll({
    where,
    order: [['id', 'ASC']],
  });
  res.json(meetings.map(formatMeeting));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const meeting = await Meeting.findByPk(id);
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
  const meeting = await Meeting.findByPk(id);
  if (!meeting) {
    throw createError(404, 'Встреча не найдена');
  }

  await meeting.update(buildMeeting(req.body));
  res.json(formatMeeting(meeting));
}));

router.delete('/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const meeting = await Meeting.findByPk(id);
  if (!meeting) {
    throw createError(404, 'Встреча не найдена');
  }

  const removedAgendas = await Agenda.count({ where: { meetingId: id } });
  const removedProtocols = await Protocol.count({ where: { meetingId: id } });
  await meeting.destroy();

  res.json({
    message: 'Встреча удалена',
    id,
    removedAgendas,
    removedProtocols,
  });
}));

module.exports = router;
