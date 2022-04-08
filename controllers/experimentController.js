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

    for(let agent of registeredAgentInformation) {        
        cancellationPromises.push(
          axios({
            method: "patch",
            url: "http://" + agent["ip"] + "/api/v1/northbound/reset-agent",
            headers: {
              "agent-secret": config.AGENT_SECRET
            }
          }).then(() => console.log("Cancelled - " + agent["ip"]))
          .catch((err) => {
            console.log(agent["ip"] + " - cancellation failed");
            rejectedResets.push(agent["ip"]);
          })
        );
    }

    await Promise.allSettled(cancellationPromises);

    console.log("Rejects - " + rejectedResets.toString());

    res.status(200).json({failures: rejectedResets});

  } catch(err) {
    next(err);
  }
});

experimentRouter.post('/schedule', verifyAdminJWT, middleware.requestLogger, async (req, res, next) => {
  try {
    const recipe = req.body.recipe;
    validateExperimentRecipe(recipe);
    await scheduleExperiment(recipe);
    
    res.sendStatus(200);

  } catch(err) {
    next(err);
  }
});

module.exports = experimentRouter;