const { authenticateAdmin, getAdminToken, authenticateAgent, getAgentToken } = require('../utils/authLogic');
const authRouter = require('express').Router();
const registry = require('../cache/agentRegistry');
const AppError = require('../utils/appError');
const middleware = require('../utils/middleware');

authRouter.post('/admin/login', middleware.requestLogger, async (req, res, next) => {
  try{
    authenticateAdmin(req.body.username, req.body.password);
    const token = getAdminToken(req.body.username);
    res.send({
      token
    });
  }
  catch(err){
    next(err);
  }
});

authRouter.post('/client-agent/register', async (req, res, next) => {
  try {
    authenticateAgent(req.body.agentSecret);
    const agentInfo = {
      ip: req.socket.remoteAddress,
      port: req.socket.remotePort,
      type: "client"
    }
    const token = getAgentToken(agentInfo);
    
    const key = agentInfo.ip + ":" + agentInfo.port;
    registry.set(key, agentInfo);
    console.log("Client-agent registered - " + agentInfo.ip + ":" + agentInfo.port);

    res.send({
      token
    });

  } catch(err) {
    next(err);
  }
});

authRouter.post('/server-agent/register', async (req, res, next) => {
  try {
    authenticateAgent(req.body.agentSecret);
    const agentInfo = {
      ip: req.socket.remoteAddress,
      port: req.socket.remotePort,
      type: "server"
    }

    const existingEntry = registry.get("server-agent");
    
    if(existingEntry !== null) {
      throw new AppError("Server agent already registered", 400);
    } else {
      registry.set("server-agent", agentInfo);
      console.log("Server-agent registered - " + agentInfo.ip + ":" + agentInfo.port);
    }

    const token = getAgentToken(agentInfo);
    res.send({
      token
    });
  } catch(err) {
    next(err);
  }
});


module.exports = authRouter;
