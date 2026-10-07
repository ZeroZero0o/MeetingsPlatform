function createError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function readId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw createError(400, 'Некорректный идентификатор');
  }
  return id;
}

function assertObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError(400, 'Тело запроса должно быть JSON-объектом');
  }
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError(400, `Поле ${field} обязательно и должно быть непустой строкой`);
  }
  return value.trim();
}

function optionalText(value, field) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value !== 'string') {
    throw createError(400, `Поле ${field} должно быть строкой`);
  }
  return value.trim();
}

function stringList(value, field) {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw createError(400, `Поле ${field} должно быть массивом строк`);
  }
  return value.map((item, index) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw createError(400, `Элемент ${field}[${index}] должен быть непустой строкой`);
    }
    return item.trim();
  });
}

function requireDate(value, field) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw createError(400, `Поле ${field} должно быть корректной датой в формате ISO`);
  }
  return new Date(value).toISOString();
}

function optionalPositiveInt(value, field) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw createError(400, `Поле ${field} должно быть положительным целым числом`);
  }
  return number;
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  createError,
  readId,
  assertObject,
  requireText,
  optionalText,
  stringList,
  requireDate,
  optionalPositiveInt,
  asyncHandler,
};
