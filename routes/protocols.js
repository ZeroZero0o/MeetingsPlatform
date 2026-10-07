const express = require('express');
const { sequelize, Meeting, Protocol, Decision } = require('../models');
const {
  createError,
  readId,
  assertObject,
  requireText,
  optionalText,
  stringList,
  requireDate,
  asyncHandler,
} = require('../utils/errors');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

const protocolInclude = [{ model: Decision, as: 'decisions' }];
const protocolOrder = [
  ['id', 'ASC'],
  [{ model: Decision, as: 'decisions' }, 'id', 'ASC'],
];

function formatProtocol(protocol) {
  return {
    id: protocol.id,
    meetingId: protocol.meetingId,
    date: protocol.date,
    secretary: protocol.secretary,
    attendees: protocol.attendees || [],
    decisions: (protocol.decisions || []).map((item) => ({
      text: item.text,
      responsible: item.responsible || '',
      deadline: item.deadline || '',
    })),
    summary: protocol.summary,
    createdAt: protocol.createdAt,
    updatedAt: protocol.updatedAt,
  };
}

function buildProtocol(body) {
  assertObject(body);

  const meetingId = Number(body.meetingId);
  if (!Number.isInteger(meetingId) || meetingId <= 0) {
    throw createError(400, 'Поле meetingId должно быть положительным целым числом');
  }

  if (!Array.isArray(body.decisions)) {
    throw createError(400, 'Поле decisions должно быть массивом решений');
  }

  const decisions = body.decisions.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw createError(400, `Элемент decisions[${index}] должен быть объектом`);
    }

    let deadline = null;
    if (item.deadline !== undefined && item.deadline !== null && item.deadline !== '') {
      if (typeof item.deadline !== 'string' || Number.isNaN(Date.parse(item.deadline))) {
        throw createError(400, `Поле decisions[${index}].deadline должно быть корректной датой`);
      }
      deadline = item.deadline.trim().slice(0, 10);
    }

    return {
      text: requireText(item.text, `decisions[${index}].text`),
      responsible: optionalText(item.responsible, `decisions[${index}].responsible`),
      deadline,
    };
  });

  return {
    meetingId,
    date: requireDate(body.date, 'date'),
    secretary: requireText(body.secretary, 'secretary'),
    attendees: stringList(body.attendees, 'attendees'),
    decisions,
    summary: requireText(body.summary, 'summary'),
  };
}

async function ensureMeeting(meetingId) {
  const meeting = await Meeting.findByPk(meetingId);
  if (!meeting) {
    throw createError(400, 'Встреча с указанным meetingId не найдена');
  }
}

async function saveDecisions(data, protocol, transaction) {
  if (data.decisions.length === 0) {
    return;
  }
  await Decision.bulkCreate(
    data.decisions.map((item) => ({
      protocolId: protocol.id,
      text: item.text,
      responsible: item.responsible,
      deadline: item.deadline,
    })),
    { transaction },
  );
}

router.get('/', asyncHandler(async (req, res) => {
  const where = {};

  if (req.query.meetingId !== undefined) {
    const meetingId = Number(req.query.meetingId);
    if (!Number.isInteger(meetingId) || meetingId <= 0) {
      throw createError(400, 'Параметр meetingId должен быть положительным целым числом');
    }
    where.meetingId = meetingId;
  }

  const protocols = await Protocol.findAll({
    where,
    include: protocolInclude,
    order: protocolOrder,
  });
  res.json(protocols.map(formatProtocol));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const protocol = await Protocol.findByPk(id, {
    include: protocolInclude,
    order: protocolOrder,
  });
  if (!protocol) {
    throw createError(404, 'Протокол не найден');
  }
  res.json(formatProtocol(protocol));
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const data = buildProtocol(req.body);
  await ensureMeeting(data.meetingId);

  const protocol = await sequelize.transaction(async (transaction) => {
    const created = await Protocol.create({
      meetingId: data.meetingId,
      date: data.date,
      secretary: data.secretary,
      attendees: data.attendees,
      summary: data.summary,
    }, { transaction });
    await saveDecisions(data, created, transaction);
    return Protocol.findByPk(created.id, {
      include: protocolInclude,
      order: protocolOrder,
      transaction,
    });
  });

  res.status(201).json(formatProtocol(protocol));
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const data = buildProtocol(req.body);
  await ensureMeeting(data.meetingId);

  const protocol = await sequelize.transaction(async (transaction) => {
    const current = await Protocol.findByPk(id, { transaction });
    if (!current) {
      throw createError(404, 'Протокол не найден');
    }

    await current.update({
      meetingId: data.meetingId,
      date: data.date,
      secretary: data.secretary,
      attendees: data.attendees,
      summary: data.summary,
    }, { transaction });
    await Decision.destroy({ where: { protocolId: id }, transaction });
    await saveDecisions(data, current, transaction);
    return Protocol.findByPk(id, {
      include: protocolInclude,
      order: protocolOrder,
      transaction,
    });
  });

  res.json(formatProtocol(protocol));
}));

router.delete('/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const protocol = await Protocol.findByPk(id);
  if (!protocol) {
    throw createError(404, 'Протокол не найден');
  }

  await protocol.destroy();
  res.json({ message: 'Протокол удалён', id });
}));

module.exports = router;
