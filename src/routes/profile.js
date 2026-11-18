const express = require('express');
const { User } = require('../../models');
const { authenticate } = require('../middleware/auth');
const { createError, asyncHandler } = require('../utils/errors');

const router = express.Router();

function formatUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw createError(401, 'Пользователь не найден');
  }
  res.json(formatUser(user));
}));

module.exports = router;
