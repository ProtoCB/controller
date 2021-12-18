const heartbeatRouter = require('express').Router();
const registry = require('../cache/agentRegistry');
const { verifyAgentJWT } = require('../utils/authLogic');

heartbeatRouter.post('/client-agent', verifyAgentJWT, async (req, res, next) => {
  try{
    const agentInfo = {
      ip: req.socket.remoteAddress,
      port: req.socket.remotePort,
      type: "client"
    }

    const key = agentInfo.ip + ":" + agentInfo.port;
    registry.set(key, agentInfo);
    
    console.log("Client Heartbeat: " + agentInfo.ip + ":" + agentInfo.port);

    res.sendStatus(200);

  }
  catch(err){
    next(err);
  }
});

heartbeatRouter.post('/server-agent', async (req, res, next) => {
  try {
    const agentInfo = {
      ip: req.socket.remoteAddress,
      port: req.socket.remotePort,
      type: "server"
    }

    registry.set("server-agent", agentInfo);
    
    console.log("Server Heartbeat: " + agentInfo.ip + ":" + agentInfo.port);
    
    res.sendStatus(200);

  } catch(err) {
    next(err);
  }
});

module.exports = heartbeatRouter;
