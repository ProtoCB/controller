const { verifyAdminJWT } = require('../utils/authLogic');
const middleware = require('../utils/middleware');
const registry = require('../cache/agentRegistry');
const experimentRouter = require('express').Router();
const axios = require('axios').default;
const config = require('../utils/config');
const { validateExperimentRecipe } = require('../recipe/recipeValidator');
const { scheduleExperiment } = require('../recipe/experimentScheduler');

experimentRouter.get('/agents', verifyAdminJWT, (req, res, next) => {
  try{
    const registeredAgentInformation = registry.getRegisteredAgentInformation();
    res.status(200).json({ "agents": registeredAgentInformation});
  } catch(err) {
    next(err);
  }
});

experimentRouter.patch('/cancel', verifyAdminJWT, middleware.requestLogger, async (req, res, next) => {
  try {
    const registeredAgentInformation = registry.getRegisteredAgentInformation();

    let cancellationPromises = [];
    let rejectedResets = []

    for(const agentId in registeredAgentInformation) {
      if(registeredAgentInformation[agentId]["experimentStatus"] != "Uninitialized") {
        
        cancellationPromises.push(
          axios({
            method: "post",
            url: agentId + "/api/v1/northbound/reset-agent",
            headers: {
              "agent-secret": config.AGENT_SECRET
            }
          }).catch((err) => {
            console.log(agentId + " - cancellation failed");
            rejectedResets.push(agentId);
          })
        );

      }
    }

    await Promise.allSettled(cancellationPromises);

    res.status(200).json({failures: rejectedResets});

  } catch(err) {
    next(err);
  }
});

experimentRouter.post('/schedule', verifyAdminJWT, middleware.requestLogger, (req, res, next) => {
  try {
    const recipe = req.body.recipe;
    validateExperimentRecipe(recipe);
    scheduleExperiment(recipe);
    
    res.sendStatus(200);

  } catch(err) {
    next(err);
  }
});

module.exports = experimentRouter;