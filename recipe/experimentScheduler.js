const registry = require('../cache/agentRegistry');

const scheduleExperiment = (recipe) => {
  const commonPayload = {
    "experimentSession": recipe["experimentSession"],
	  "eventsToLog": recipe["eventsToLog"],
	  "circuitBreakerType": recipe["circuitBreakerType"],
	  "circuitBreakerParameters": recipe["circuitBreakerParameters"],
    "experimentSchedule": {
      "start": recipe["experimentStartTime"],
      "end": recipe["experimentStartTime"] + recipe["experimentDuration"]
    }
  };

  const serverAvailabilitySchedule = [...recipe["serverAvailabilitySchedule"]];
  for(let entry of serverAvailabilitySchedule) {
    entry["time"] = entry["time"] + recipe["experimentStartTime"];
  }

  commonPayload["serverAvailabilitySchedule"] = serverAvailabilitySchedule;

  const clientAgents = registry.keys();
  let index = array.indexOf("server-agent");
  if (index !== -1) {
    clientAgents.splice(index, 1);
  }

  clientAgents.sort();

  scheduleExperimentOnServerAgent(commonPayload, recipe, clientAgents);

};

const scheduleExperimentOnServerAgent = (commonPayload, recipe, clientAgents) => {
  const serverUrl = registry.get("server-agent")["ip"];
  const startTime = recipe["experimentStartTime"];

  const networkPartitionSchedule = recipe["networkPartitionSchedule"].map((entry) => {
    let scheduleEntry = {};
    scheduleEntry["networkPartitioned"] = entry["networkPartitioned"];
    scheduleEntry["time"] = entry["time"] + startTime;

    if(scheduleEntry["networkPartitioned"]) {
      const partitions = entry["partitions"];
      let accessibleClients = [];
      for(let i = 0; i<recipe["experimentClientCount"];) {
        // TODO
      }
    }

    return scheduleEntry;
  });
  /*
  {
		"networkPartitioned": true,
		"partition": ["localhost:8080", "192.168.0.108"],
		"time": 1644218345
	}
  
  {
		"networkPartitioned": true,
		"partitions": [{
			"clientCount": 3,
			"serverAccessible": true
		}, {
			"clientCount": 2,
			"serverAccessible": false
		}],
		"time": 7
	}

  */
};

module.exports = {
  scheduleExperiment
};