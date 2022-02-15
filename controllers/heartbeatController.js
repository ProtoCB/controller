const heartbeatRouter = require('express').Router();
const registry = require('../cache/agentRegistry');
const { authenticateAgent } = require('../utils/authLogic');

heartbeatRouter.post('/client-agent', authenticateAgent, async (req, res, next) => {
  try{
    const key = req.body.ip;
    const agentInfo = {
      "ip": req.body.ip,
      "experimentSession": req.body.experimentSession,
      "experimentStatus": req.body.experimentStatus
    };


    const existingEntry = registry.get(key);
    registry.set(key, agentInfo);

    if(existingEntry === null) {
      console.log("Registering client-agent: " + agentInfo.ip);
    } else {
      console.log("Client-agent heartbeat: " + agentInfo.ip);
    }

    console.log(agentInfo);

    res.sendStatus(200);
  }
  catch(err){
    next(err);
  }
});

heartbeatRouter.post('/server-agent', authenticateAgent, async (req, res, next) => {
  try {
    const agentInfo = {
      "ip": req.body.ip,
      "experimentSession": req.body.experimentSession,
      "experimentStatus": req.body.experimentStatus
    };

    const existingEntry = registry.get("server-agent");
    registry.set("server-agent", agentInfo);
    
    if(existingEntry === null) {
      console.log("Registering server-agent: " + agentInfo.ip);
    } else {
      console.log("Server-agent heartbeat: " + agentInfo.ip);
    }

    console.log(agentInfo);

    res.sendStatus(200);

  } catch(err) {
    next(err);
  }
});

module.exports = heartbeatRouter;
