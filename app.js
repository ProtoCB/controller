const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');

const middleware = require('./utils/middleware');
const { limiter } = require('./utils/limiters');
const authRouter = require('./controllers/authController');
const { verifyAdminJWT } = require('./utils/authLogic');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: '*'
  })
);
app.use(xss());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

app.use(middleware.requestLogger);

app.use(limiter);

app.get('/', verifyAdminJWT, (req, res, next) => {
  res.sendStatus(200);
})

app.use('/api/v1/auth', authRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
