require('dotenv').config();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;
const LIMITER_HOURS = process.env.LIMITER_HOURS;
const AUTH_LIMITER_HOURS = process.env.AUTH_LIMITER_HOURS;
const RECORD_TTL = process.env.RECORD_TTL;

module.exports = {
  PORT,
  NODE_ENV,
  LIMITER_HOURS,
  AUTH_LIMITER_HOURS,
  RECORD_TTL
};
