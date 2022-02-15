const registry = require('../cache/agentRegistry');
const AppError = require('../utils/appError');

const validateExperimentRecipe = (recipe) => {
  const registeredAgents = registry.keys();

  if(!registeredAgents.includes("server-agent")) {
    throw new AppError("No server-agent registered");
  }

  if(recipe["experimentClientCount"] != registeredAgents.length - 1) {
    throw new AppError("Enough client-agents are not registered for this experiment");
  }

  const now = new Date();
  const secondsSinceEpoch = Math.round(now.getTime() / 1000);
  if(secondsSinceEpoch >= recipe["experimentStartTime"]) {
    throw new AppError("Experiment's start time should be in future");
  }

  if(recipe["experimentDuration"] <= 0) {
    throw new AppError("Experiment duration must be a positive number");
  }

  const networkPartitionSchedule = recipe["networkPartitionSchedule"];
  for(const partitionConfig of networkPartitionSchedule) {
    if(partitionConfig["networkPartitioned"] == true) {
      const clientCount = 0;
      for(const partition of partitionConfig["partitions"]) {
        clientCount += partition["clientCount"];
      }
      if(clientCount != recipe["experimentClientCount"]) {
        throw new AppError("Incorrect network partition found");
      }
    }
  }

  const clientGroups = recipe["clientGroups"];
  const clientCount = 0;
  for(const clientGroup of clientGroups) {
    clientCount += clientGroup["clientCount"];
  }
  if(clientCount != recipe["experimentClientCount"]) {
    throw new AppError("Incorrect client grouping");
  }

}

module.exports = {
  validateExperimentRecipe
};