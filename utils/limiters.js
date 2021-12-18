const rateLimit = require('express-rate-limit');
const config = require('./config');

let limit = 120;
if(config.NODE_ENV === 'development') {
  limit = 1000;
}

const limiter = rateLimit({
    max: limit,
    windowMs: config.LIMITER_HOURS * 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again after some time!'
});

const authLimiter = rateLimit({
    max: limit,
    windowMs: config.AUTH_LIMITER_HOURS * 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again after some time!'
});

module.exports = {
    limiter,
    authLimiter,
}
