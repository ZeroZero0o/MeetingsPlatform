const jwt = require('jsonwebtoken');
const { createError } = require('../utils/errors');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(createError(401, 'Требуется заголовок Authorization: Bearer <token>'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(createError(401, 'Требуется заголовок Authorization: Bearer <token>'));
    return;
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    next(createError(401, 'Недействительный или просроченный токен'));
  }
}

function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    next(createError(403, 'Доступно только администратору'));
    return;
  }
  next();
}

module.exports = {
  authenticate,
  isAdmin,
};
