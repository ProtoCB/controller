const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');

const middleware = require('./utils/middleware');
const { limiter } = require('./utils/limiters');
const authRouter = require('./controllers/authController');
const { verifyAdminJWT } = require('./utils/authLogic');
const heartbeatRouter = require('./controllers/heartbeatController');
const experimentRouter = require('./controllers/experimentController');

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

// app.use(middleware.requestLogger);

app.use(limiter);

app.get('/', verifyAdminJWT, (req, res, next) => {
  res.send();
})

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/heartbeat', heartbeatRouter);
app.use('/api/v1/experiment', experimentRouter);


app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
