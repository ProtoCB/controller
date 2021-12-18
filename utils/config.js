require('dotenv').config();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;
const LIMITER_HOURS = process.env.LIMITER_HOURS;
const AUTH_LIMITER_HOURS = process.env.AUTH_LIMITER_HOURS;
const RECORD_TTL = process.env.RECORD_TTL;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = {
  PORT,
  NODE_ENV,
  LIMITER_HOURS,
  AUTH_LIMITER_HOURS,
  RECORD_TTL,
  USERNAME,
  PASSWORD,
  JWT_EXPIRES_IN,
  JWT_SECRET
};
