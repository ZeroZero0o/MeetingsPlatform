require('dotenv').config();

const express = require('express');
const meetingsRouter = require('./routes/meetings');
const agendasRouter = require('./routes/agendas');
const protocolsRouter = require('./routes/protocols');
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { sequelize } = require('./models');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    name: 'Система управления собраниями и встречами',
    resources: {
      meetings: '/meetings',
      agendas: '/agendas',
      protocols: '/protocols',
      register: 'POST /auth/register',
      login: 'POST /auth/login',
      profile: 'GET /profile',
    },
  });
});

app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/meetings', meetingsRouter);
app.use('/agendas', agendasRouter);
app.use('/protocols', protocolsRouter);

app.use(notFound);
app.use(errorHandler);

if (!process.env.JWT_SECRET) {
  console.error('Не задан JWT_SECRET в файле .env');
  process.exit(1);
}

sequelize.authenticate()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Не удалось подключиться к PostgreSQL:', error.message);
    process.exit(1);
  });
