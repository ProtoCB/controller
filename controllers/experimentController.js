const { verifyAdminJWT } = require('../utils/authLogic');
const middleware = require('../utils/middleware');
const registry = require('../cache/agentRegistry');
const experimentRouter = require('express').Router();
const axios = require('axios').default;
const config = require('../utils/config');

experimentRouter.get('/agents', verifyAdminJWT, middleware.requestLogger, (req, res, next) => {
  try{
    const registeredAgentInformation = registry.getRegisteredAgentInformation();
    res.json(registeredAgentInformation);
  } catch(err) {
    next(err);
  }
});

experimentRouter.patch('/experiment/cancel', verifyAdminJWT, middleware.requestLogger, (req, res, next) => {
  try {
    const registeredAgentInformation = registry.getRegisteredAgentInformation();

    let cancellationPromises = [];

    for(const agentId in registeredAgentInformation) {
      if(registeredAgentInformation[agentId]["experimentStatus"] != "Uninitialized") {
        
        cancellationPromises.push(
          axios({
            method: "post",
            url: agentId + "/api/v1/northbound/reset-agent",
            headers: {
              "agent-secret": config.AGENT_SECRET
            }
          }).catch((err) => {console.log(agentId + " - cancellation failed")})
        );

      }
    }

    await Promise.allSettled(cancellationPromises);

    res.sendStatus(200);

  } catch(err) {
    next(err);
  }
});

module.exports = experimentRouter;