function notFound(req, res, next) {
  const error = new Error(`Маршрут ${req.method} ${req.originalUrl} не найден`);
  error.status = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
    return;
  }

  // Ошибки валидации Mongoose (например, не прошло required/enum).
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})
      .map((item) => item.message)
      .join('; ');
    res.status(400).json({ error: message || err.message });
    return;
  }

  // Некорректный ObjectId (CastError) — неверный идентификатор.
  if (err.name === 'CastError') {
    res.status(400).json({ error: 'Некорректный идентификатор' });
    return;
  }

  // Дубликат уникального поля (например, email).
  if (err.name === 'MongoServerError' && err.code === 11000) {
    res.status(409).json({ error: 'Запись с таким значением уже существует' });
    return;
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: status >= 500 ? 'Внутренняя ошибка сервера' : err.message,
  });
}

module.exports = {
  notFound,
  errorHandler,
};
