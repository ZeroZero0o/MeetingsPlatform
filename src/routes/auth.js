const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { createError, assertObject, requireText, asyncHandler } = require('../utils/errors');

const router = express.Router();

function readCredentials(body) {
  assertObject(body);

  const email = requireText(body.email, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError(400, 'Поле email должно быть корректным адресом');
  }

  if (typeof body.password !== 'string' || body.password.length < 6) {
    throw createError(400, 'Пароль должен содержать не менее 6 символов');
  }

  return { email, password: body.password };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password } = readCredentials(req.body);
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw createError(409, 'Пользователь с таким email уже существует');
  }

  const user = await User.create({
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'user',
  });

  res.status(201).json(user);
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = readCredentials(req.body);
  const user = await User.findOne({ where: { email } });
  const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !matches) {
    throw createError(401, 'Неверный email или пароль');
  }

  res.json({
    token: signToken(user),
    user,
  });
}));

module.exports = router;
