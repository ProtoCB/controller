const registry = require('../cache/agentRegistry');
const AppError = require('../utils/appError');

const validateCircuitBreakerParameters = (recipe) => {
  let requiredParameters;
  
  if(recipe["circuitBreakerType"] == "Static") {
    requiredParameters = ["FT", "HOFT", "HOST", "OD", "WS"];
  } else if(recipe["circuitBreakerType"] == "GEDCB") {
    requiredParameters = ["SFT", "HFT", "SST", "HOFT", "HOST", "OD", "WS", "maxAge", "gossipPeriod", "gossipCount", "pushPullGossip", "suspicionGossipCount", "gsrMessageCount", "minSetSize", "setRevisionPeriod"];
  }

  let includesExpectedParameters = requiredParameters.every(param => Object.keys(recipe["circuitBreakerParameters"]).includes(param));

  if(!includesExpectedParameters) {
    throw new AppError("Some circuit breaker parameters are missing")
  }

}

const validateExperimentRecipe = (recipe) => {
  let registeredAgents = registry.keys();

  if(!registeredAgents.includes("server-agent")) {
    throw new AppError("No server-agent registered");
  }

  if(recipe["experimentClientCount"] > registeredAgents.length - 1) {
    throw new AppError("Enough client-agents are not registered for this experiment");
  }

  let now = new Date();
  let secondsSinceEpoch = Math.round(now.getTime() / 1000);
  if(secondsSinceEpoch >= recipe["experimentStartTime"]) {
    throw new AppError("Experiment's start time should be in future");
  }

  if(recipe["experimentDuration"] <= 0) {
    throw new AppError("Experiment duration must be a positive number");
  }

  let networkPartitionSchedule = recipe["networkPartitionSchedule"];
  for(let partitionConfig of networkPartitionSchedule) {
    if(partitionConfig["networkPartitioned"] == true) {
      let clientCount = 0;
      for(let partition of partitionConfig["partitions"]) {
        clientCount += partition["clientCount"];
      }
      if(clientCount != recipe["experimentClientCount"]) {
        throw new AppError("Incorrect network partition found");
      }
    }
  }

  let clientGroups = recipe["clientGroups"];
  let clientCount = 0;
  for(let clientGroup of clientGroups) {
    clientCount += clientGroup["clientCount"];
  }
  if(clientCount != recipe["experimentClientCount"]) {
    throw new AppError("Incorrect client grouping");
  }

  validateCircuitBreakerParameters(recipe);
  
}

module.exports = {
  validateExperimentRecipe
};