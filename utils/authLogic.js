const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('./appError');
const config = require('./config');

const getAdminToken = (username) => {
    return jwt.sign({username}, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN
    });
};

const verifyAdminJWT = async (req, res, next) => {
  try{
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if(!token) {
      return next(new AppError('User not logged in', 401));
    }

    const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);

    if (decoded.username != config.USERNAME) {
      return next(new AppError('Incorrect username', 401));
    }
    next();
  }
  catch(err){
    next(err);
  }
};

const authenticateAdmin = (username, password) => {
  if(config.USERNAME != username || config.PASSWORD != password) {
    throw new AppError("Invalid username or password", 400);
  }
};

const getAgentToken = (agentInfo) => {
  return jwt.sign({"agent": agentInfo}, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
  });
};

const verifyAgentJWT = async (req, res, next) => {
  try{
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if(!token) {
      return next(new AppError('Agent not registered', 401));
    }

    const decodedAgentPayload = await promisify(jwt.verify)(token, config.JWT_SECRET);
    const { ip, port } = decodedAgentPayload["agent"];

    if (ip != req.connection.remoteAddress) {
      return next(new AppError('Incorrect IP Address', 401));
    }

    if (port != req.connection.remotePort) {
      return next(new AppError('Incorrect Port', 401));
    }

    next();
  }
  catch(err){
    next(err);
  }
};

const authenticateAgent = (secret) => {
  if(config.AGENT_SECRET != secret) {
    throw new AppError("Invalid agent secret", 400);
  }
};

module.exports = {
  getAdminToken,
  authenticateAdmin,
  verifyAdminJWT,
  getAgentToken,
  authenticateAgent,
  verifyAgentJWT
};