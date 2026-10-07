const express = require('express');
const { sequelize, Meeting, Agenda, AgendaItem } = require('../models');
const {
  createError,
  readId,
  assertObject,
  requireText,
  optionalPositiveInt,
  asyncHandler,
} = require('../utils/errors');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

const agendaInclude = [{ model: AgendaItem, as: 'items' }];
const agendaOrder = [
  ['id', 'ASC'],
  [{ model: AgendaItem, as: 'items' }, 'order', 'ASC'],
];

function formatAgenda(agenda) {
  const items = [...(agenda.items || [])]
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      order: item.order,
      topic: item.topic,
      speaker: item.speaker || '',
      durationMin: item.durationMin,
    }));

  return {
    id: agenda.id,
    meetingId: agenda.meetingId,
    title: agenda.title,
    items,
    createdAt: agenda.createdAt,
    updatedAt: agenda.updatedAt,
  };
}

function buildAgenda(body) {
  assertObject(body);

  const meetingId = Number(body.meetingId);
  if (!Number.isInteger(meetingId) || meetingId <= 0) {
    throw createError(400, 'Поле meetingId должно быть положительным целым числом');
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw createError(400, 'Поле items должно быть непустым массивом вопросов повестки');
  }

  const items = body.items.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw createError(400, `Элемент items[${index}] должен быть объектом`);
    }

    const topic = requireText(item.topic, `items[${index}].topic`);
    const order = item.order === undefined ? index + 1 : Number(item.order);
    if (!Number.isInteger(order) || order <= 0) {
      throw createError(400, `Поле items[${index}].order должно быть положительным целым числом`);
    }

    let speaker = '';
    if (item.speaker !== undefined && item.speaker !== null && item.speaker !== '') {
      if (typeof item.speaker !== 'string') {
        throw createError(400, `Поле items[${index}].speaker должно быть строкой`);
      }
      speaker = item.speaker.trim();
    }

    return {
      order,
      topic,
      speaker,
      durationMin: optionalPositiveInt(item.durationMin, `items[${index}].durationMin`),
    };
  });

  items.sort((a, b) => a.order - b.order);

  return {
    meetingId,
    title: requireText(body.title, 'title'),
    items,
  };
}

async function ensureMeeting(meetingId) {
  const meeting = await Meeting.findByPk(meetingId);
  if (!meeting) {
    throw createError(400, 'Встреча с указанным meetingId не найдена');
  }
}

async function saveAgenda(data, agenda, transaction) {
  const payload = data.items.map((item) => ({
    agendaId: agenda.id,
    order: item.order,
    topic: item.topic,
    speaker: item.speaker,
    durationMin: item.durationMin,
  }));
  await AgendaItem.bulkCreate(payload, { transaction });
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

  const agendas = await Agenda.findAll({
    where,
    include: agendaInclude,
    order: agendaOrder,
  });
  res.json(agendas.map(formatAgenda));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const agenda = await Agenda.findByPk(id, {
    include: agendaInclude,
    order: agendaOrder,
  });
  if (!agenda) {
    throw createError(404, 'Повестка не найдена');
  }
  res.json(formatAgenda(agenda));
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const data = buildAgenda(req.body);
  await ensureMeeting(data.meetingId);

  const agenda = await sequelize.transaction(async (transaction) => {
    const created = await Agenda.create(
      { meetingId: data.meetingId, title: data.title },
      { transaction },
    );
    await saveAgenda(data, created, transaction);
    return Agenda.findByPk(created.id, {
      include: agendaInclude,
      order: agendaOrder,
      transaction,
    });
  });

  res.status(201).json(formatAgenda(agenda));
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const data = buildAgenda(req.body);
  await ensureMeeting(data.meetingId);

  const agenda = await sequelize.transaction(async (transaction) => {
    const current = await Agenda.findByPk(id, { transaction });
    if (!current) {
      throw createError(404, 'Повестка не найдена');
    }

    await current.update(
      { meetingId: data.meetingId, title: data.title },
      { transaction },
    );
    await AgendaItem.destroy({ where: { agendaId: id }, transaction });
    await saveAgenda(data, current, transaction);
    return Agenda.findByPk(id, {
      include: agendaInclude,
      order: agendaOrder,
      transaction,
    });
  });

  res.json(formatAgenda(agenda));
}));

router.delete('/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const agenda = await Agenda.findByPk(id);
  if (!agenda) {
    throw createError(404, 'Повестка не найдена');
  }

  await agenda.destroy();
  res.json({ message: 'Повестка удалена', id });
}));

module.exports = router;
