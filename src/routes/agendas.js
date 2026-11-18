const express = require('express');
const mongoose = require('mongoose');
const { Meeting, Agenda } = require('../../models');
const {
  createError,
  readId,
  assertObject,
  requireText,
  optionalText,
  optionalPositiveInt,
  asyncHandler,
} = require('../utils/errors');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

function formatItem(item) {
  return {
    id: item._id ? item._id.toString() : undefined,
    sortOrder: item.sortOrder,
    topic: item.topic,
    speaker: item.speaker || '',
    durationMin: item.durationMin,
  };
}

function formatAgenda(agenda) {
  return {
    id: agenda._id.toString(),
    meetingId: agenda.meetingId ? agenda.meetingId.toString() : null,
    title: agenda.title,
    items: (agenda.items || []).map(formatItem),
    createdAt: agenda.createdAt,
    updatedAt: agenda.updatedAt,
  };
}

function buildAgenda(body) {
  assertObject(body);

  const meetingId = readId(body.meetingId);
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw createError(400, 'Поле items должно быть непустым массивом вопросов повестки');
  }

  const items = body.items.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw createError(400, `Элемент items[${index}] должен быть объектом`);
    }
    const sortOrder = Number(item.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder <= 0) {
      throw createError(400, `Поле items[${index}].sortOrder должно быть положительным целым числом`);
    }
    return {
      sortOrder,
      topic: requireText(item.topic, `items[${index}].topic`),
      speaker: optionalText(item.speaker, `items[${index}].speaker`),
      durationMin: optionalPositiveInt(item.durationMin, `items[${index}].durationMin`),
    };
  });

  items.sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    meetingId,
    title: requireText(body.title, 'title'),
    items,
  };
}

function buildItem(body, field = 'item') {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError(400, `Поле ${field} должно быть объектом`);
  }

  const item = {
    topic: requireText(body.topic, `${field}.topic`),
  };

  if (body.speaker !== undefined) {
    item.speaker = optionalText(body.speaker, `${field}.speaker`);
  }
  if (body.durationMin !== undefined) {
    item.durationMin = optionalPositiveInt(body.durationMin, `${field}.durationMin`);
  }
  if (body.sortOrder !== undefined) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder <= 0) {
      throw createError(400, `Поле ${field}.sortOrder должно быть положительным целым числом`);
    }
    item.sortOrder = sortOrder;
  }

  return item;
}

// Частичное обновление элемента массива: включаются только переданные поля.
function buildItemPatch(body) {
  assertObject(body);
  const patch = {};

  if (body.topic !== undefined) patch.topic = requireText(body.topic, 'topic');
  if (body.speaker !== undefined) patch.speaker = optionalText(body.speaker, 'speaker');
  if (body.durationMin !== undefined) patch.durationMin = optionalPositiveInt(body.durationMin, 'durationMin');
  if (body.sortOrder !== undefined) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder <= 0) {
      throw createError(400, 'Поле sortOrder должно быть положительным целым числом');
    }
    patch.sortOrder = sortOrder;
  }

  return patch;
}

async function ensureMeeting(meetingId) {
  const exists = await Meeting.exists({ _id: meetingId });
  if (!exists) {
    throw createError(400, 'Встреча с указанным meetingId не найдена');
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.meetingId !== undefined) {
    filter.meetingId = readId(req.query.meetingId);
  }

  const agendas = await Agenda.find(filter).sort({ createdAt: 1 });
  res.json(agendas.map(formatAgenda));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const agenda = await Agenda.findById(id);
  if (!agenda) {
    throw createError(404, 'Повестка не найдена');
  }
  res.json(formatAgenda(agenda));
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const data = buildAgenda(req.body);
  await ensureMeeting(data.meetingId);

  const agenda = await Agenda.create(data);
  res.status(201).json(formatAgenda(agenda));
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const data = buildAgenda(req.body);
  await ensureMeeting(data.meetingId);

  const agenda = await Agenda.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!agenda) {
    throw createError(404, 'Повестка не найдена');
  }
  res.json(formatAgenda(agenda));
}));

router.delete('/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const agenda = await Agenda.findByIdAndDelete(id);
  if (!agenda) {
    throw createError(404, 'Повестка не найдена');
  }
  res.json({ message: 'Повестка удалена', id });
}));

// --- Работа с вложенным массивом items ---

// Добавление вопроса в повестку (вложенный массив): $push.
router.post('/:id/items', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const agenda = await Agenda.findById(id);
  if (!agenda) {
    throw createError(404, 'Повестка не найдена');
  }

  const item = buildItem(req.body);
  if (item.sortOrder === undefined) {
    item.sortOrder = (agenda.items || []).length + 1;
  }

  const updated = await Agenda.findByIdAndUpdate(
    id,
    { $push: { items: item } },
    { new: true, runValidators: true },
  );
  res.status(201).json(formatAgenda(updated));
}));

// Обновление элемента внутри массива: $set + arrayFilters.
router.patch('/:id/items/:itemId', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const itemId = readId(req.params.itemId);

  const patch = buildItemPatch(req.body);
  if (Object.keys(patch).length === 0) {
    throw createError(400, 'Нет полей для обновления');
  }

  const set = {};
  for (const [key, value] of Object.entries(patch)) {
    set[`items.$[elem].${key}`] = value;
  }

  const updated = await Agenda.findByIdAndUpdate(
    id,
    { $set: set },
    {
      arrayFilters: [{ 'elem._id': new mongoose.Types.ObjectId(itemId) }],
      new: true,
      runValidators: true,
    },
  );
  if (!updated) {
    throw createError(404, 'Повестка не найдена');
  }
  res.json(formatAgenda(updated));
}));

// Удаление элемента из вложенного массива: $pull.
router.delete('/:id/items/:itemId', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const itemId = readId(req.params.itemId);

  const updated = await Agenda.findByIdAndUpdate(
    id,
    { $pull: { items: { _id: new mongoose.Types.ObjectId(itemId) } } },
    { new: true },
  );
  if (!updated) {
    throw createError(404, 'Повестка не найдена');
  }
  res.json(formatAgenda(updated));
}));

module.exports = router;
