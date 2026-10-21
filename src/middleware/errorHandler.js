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

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const message = Array.isArray(err.errors) && err.errors.length
      ? err.errors.map((item) => item.message).join('; ')
      : err.message;
    res.status(400).json({ error: message });
    return;
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    res.status(400).json({ error: 'Нарушена связь между таблицами' });
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
