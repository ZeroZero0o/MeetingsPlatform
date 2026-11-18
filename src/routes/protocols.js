const express = require('express');
const mongoose = require('mongoose');
const { Meeting, Protocol } = require('../../models');
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

function formatDecision(decision) {
  return {
    id: decision._id ? decision._id.toString() : undefined,
    text: decision.text,
    responsible: decision.responsible || '',
    deadline: decision.deadline || '',
  };
}

function formatProtocol(protocol) {
  return {
    id: protocol._id.toString(),
    meetingId: protocol.meetingId ? protocol.meetingId.toString() : null,
    date: protocol.date,
    secretary: protocol.secretary,
    attendees: protocol.attendees || [],
    decisions: (protocol.decisions || []).map(formatDecision),
    summary: protocol.summary,
    createdAt: protocol.createdAt,
    updatedAt: protocol.updatedAt,
  };
}

function buildProtocol(body) {
  assertObject(body);

  const meetingId = readId(body.meetingId);
  if (!Array.isArray(body.decisions)) {
    throw createError(400, 'Поле decisions должно быть массивом решений');
  }

  const decisions = body.decisions.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw createError(400, `Элемент decisions[${index}] должен быть объектом`);
    }

    let deadline = '';
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

function buildDecision(body, field = 'decision') {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError(400, `Поле ${field} должно быть объектом`);
  }

  const decision = {
    text: requireText(body.text, `${field}.text`),
  };

  if (body.responsible !== undefined) {
    decision.responsible = optionalText(body.responsible, `${field}.responsible`);
  }
  if (body.deadline !== undefined && body.deadline !== null && body.deadline !== '') {
    if (typeof body.deadline !== 'string' || Number.isNaN(Date.parse(body.deadline))) {
      throw createError(400, `Поле ${field}.deadline должно быть корректной датой`);
    }
    decision.deadline = body.deadline.trim().slice(0, 10);
  }

  return decision;
}

// Частичное обновление элемента массива: включаются только переданные поля.
function buildDecisionPatch(body) {
  assertObject(body);
  const patch = {};

  if (body.text !== undefined) patch.text = requireText(body.text, 'text');
  if (body.responsible !== undefined) patch.responsible = optionalText(body.responsible, 'responsible');
  if (body.deadline !== undefined) {
    if (body.deadline !== null && body.deadline !== '') {
      if (typeof body.deadline !== 'string' || Number.isNaN(Date.parse(body.deadline))) {
        throw createError(400, 'Поле deadline должно быть корректной датой');
      }
      patch.deadline = body.deadline.trim().slice(0, 10);
    } else {
      patch.deadline = '';
    }
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

  const protocols = await Protocol.find(filter).sort({ createdAt: 1 });
  res.json(protocols.map(formatProtocol));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const protocol = await Protocol.findById(id);
  if (!protocol) {
    throw createError(404, 'Протокол не найден');
  }
  res.json(formatProtocol(protocol));
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const data = buildProtocol(req.body);
  await ensureMeeting(data.meetingId);

  const protocol = await Protocol.create(data);
  res.status(201).json(formatProtocol(protocol));
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const data = buildProtocol(req.body);
  await ensureMeeting(data.meetingId);

  const protocol = await Protocol.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!protocol) {
    throw createError(404, 'Протокол не найден');
  }
  res.json(formatProtocol(protocol));
}));

router.delete('/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const protocol = await Protocol.findByIdAndDelete(id);
  if (!protocol) {
    throw createError(404, 'Протокол не найден');
  }
  res.json({ message: 'Протокол удалён', id });
}));

// --- Работа с вложенным массивом decisions ---

// Добавление решения в протокол: $push.
router.post('/:id/decisions', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const decision = buildDecision(req.body);

  const protocol = await Protocol.findByIdAndUpdate(
    id,
    { $push: { decisions: decision } },
    { new: true, runValidators: true },
  );
  if (!protocol) {
    throw createError(404, 'Протокол не найден');
  }
  res.status(201).json(formatProtocol(protocol));
}));

// Обновление элемента внутри массива: $set + arrayFilters.
router.patch('/:id/decisions/:decisionId', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const decisionId = readId(req.params.decisionId);

  const patch = buildDecisionPatch(req.body);
  if (Object.keys(patch).length === 0) {
    throw createError(400, 'Нет полей для обновления');
  }

  const set = {};
  for (const [key, value] of Object.entries(patch)) {
    set[`decisions.$[elem].${key}`] = value;
  }

  const protocol = await Protocol.findByIdAndUpdate(
    id,
    { $set: set },
    {
      arrayFilters: [{ 'elem._id': new mongoose.Types.ObjectId(decisionId) }],
      new: true,
      runValidators: true,
    },
  );
  if (!protocol) {
    throw createError(404, 'Протокол не найден');
  }
  res.json(formatProtocol(protocol));
}));

// Удаление элемента из вложенного массива: $pull.
router.delete('/:id/decisions/:decisionId', authenticate, asyncHandler(async (req, res) => {
  const id = readId(req.params.id);
  const decisionId = readId(req.params.decisionId);

  const protocol = await Protocol.findByIdAndUpdate(
    id,
    { $pull: { decisions: { _id: new mongoose.Types.ObjectId(decisionId) } } },
    { new: true },
  );
  if (!protocol) {
    throw createError(404, 'Протокол не найден');
  }
  res.json(formatProtocol(protocol));
}));

module.exports = router;
