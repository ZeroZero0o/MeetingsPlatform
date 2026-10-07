const express = require('express');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { createError, asyncHandler } = require('../utils/errors');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw createError(401, 'Пользователь не найден');
  }
  res.json(user);
}));

module.exports = router;
