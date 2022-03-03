const registry = require('../cache/agentRegistry');
const axios = require('axios').default;
const { bucket }  = require('../firebase/storage');
const config = require('../utils/config');

const scheduleExperiment = async (recipe) => {
  let commonPayload = {
    "experimentSession": recipe["experimentSession"],
	  "eventsToLog": recipe["eventsToLog"],
	  "circuitBreakerType": recipe["circuitBreakerType"],
	  "circuitBreakerParameters": recipe["circuitBreakerParameters"],
    "experimentSchedule": {
      "start": recipe["experimentStartTime"],
      "end": recipe["experimentStartTime"] + recipe["experimentDuration"]
    }
  };

  let serverAvailabilitySchedule = [...recipe["serverAvailabilitySchedule"]];
  for(let entry of serverAvailabilitySchedule) {
    entry["time"] = entry["time"] + recipe["experimentStartTime"];
  }

  commonPayload["serverAvailabilitySchedule"] = serverAvailabilitySchedule;

  let clientAgents = registry.keys();
  clientAgents.sort();

  let index = clientAgents.indexOf("server-agent");
  if (index !== -1) {
    clientAgents.splice(index, 1);
  }

  console.log("Scheduling - " + recipe["experimentSession"]);

  await initializeFirebaseFolder(recipe["experimentSession"], clientAgents);
  await scheduleExperimentOnServerAgent(commonPayload, recipe, clientAgents);
  await scheduleExperimentOnClientAgents(commonPayload, recipe, clientAgents);

};

const initializeFirebaseFolder = async (sessionId, agents) => {
  try {
    agents.push("server-" + registry.get("server-agent")["ip"])
    await bucket.file(sessionId + '/participants.json').save(JSON.stringify(agents));
  } catch(ex) {
    console.log(ex);
    console.log("Failed to initialize firebase storage folder for experiment session - " + sessionId);
  }
};

const scheduleExperimentOnClientAgents = async (commonPayload, recipe, clientAgents) => {
  try {

    console.log("Now scheduling for client agents");
    
    let startTime = recipe["experimentStartTime"];
    let serverUrl = registry.get("server-agent")["ip"];

    let schedulingPromises = [];
    let recipeUploads = [];
    let rejectedAgentSchedulings = []

    let unfurledNetworkPartitionSchedule = recipe["networkPartitionSchedule"].map((entry) => {
      let scheduleEntry = {};
      scheduleEntry["networkPartitioned"] = entry["networkPartitioned"];
      scheduleEntry["time"] = entry["time"] + startTime;

      let networkPartitions = [];

      if(scheduleEntry["networkPartitioned"]) {
        let partitions = entry["partitions"];
        let index = 0;
        for(let partition of partitions) {
          let unfurledPartition = [];
          for(let i = 0; i < partition["clientCount"]; i++) {
            unfurledPartition.push(clientAgents[index]);
            index++;
          }
          if(partition["serverAccessible"]) {
            unfurledPartition.push(serverUrl);
          }
          networkPartitions.push(unfurledPartition);
        }
      }

      scheduleEntry["partitions"] = networkPartitions;

      return scheduleEntry;
    });
    
    let index = 0;
    for(let group of recipe["clientGroups"]) {

      for(let entry of group["requestRateSchedule"]) {
        entry["time"] = entry["time"] + startTime;
      }

      for(let entry of group["clientLifeSchedule"]) {
        entry["time"] = entry["time"] + startTime;
      }

      for(let i = 0; i < group["clientCount"]; i++) {

        let clientUrl = clientAgents[index];
        index++;

        let clientSchedulingPayload = {
          ...commonPayload,
          "serverUrl": serverUrl,
          "minLatency": group["minLatency"],
          "failureInferenceTime": group["failureInferenceTime"],
          "tfProbability": group["tfProbability"],
          "requestRateSchedule": group["requestRateSchedule"],
          "clientLifeSchedule": group["clientLifeSchedule"]
        };

        let networkPartitionSchedule = unfurledNetworkPartitionSchedule.map((entry) => {
          let scheduleEntry = {};
          scheduleEntry["networkPartitioned"] = entry["networkPartitioned"];
          scheduleEntry["time"] = entry["time"];
      
          let accessibleNetworkPartition = [];
      
          if(entry["networkPartitioned"]) {
            let partitions = entry["partitions"];
            for(let partition of partitions) {
              if(partition.includes(clientUrl)) {
                accessibleNetworkPartition = partition;
                break;
              }
            }
          }
      
          scheduleEntry["partition"] = accessibleNetworkPartition;
      
          return scheduleEntry;
        });

        clientSchedulingPayload["networkPartitionSchedule"] = networkPartitionSchedule;

        schedulingPromises.push(
          axios({
            method: "post",
            url: "http://" + clientUrl + "/api/v1/northbound/schedule-experiment",
            headers: {
              "agent-secret": config.AGENT_SECRET
            },
            data: clientSchedulingPayload
          }).then((response) => {
            console.log(clientUrl + " - success in scheduling");
          }).catch((err) => {
            console.log(clientUrl + " - scheduling failed");
            rejectedAgentSchedulings.push(clientUrl);
        })
        );

        recipeUploads.push(bucket
          .file(recipe["experimentSession"] + '/recipes/' + clientUrl + ".json")
          .save(JSON.stringify(clientSchedulingPayload))
          .then(() => console.log("Firebase: Recipe uploaded for " + clientUrl))
          .catch((ex) => {
            console.log(ex);
            console.log("Firebase: Failed to upload recipe for - " + clientUrl);
          }));

      }  
    }

    await Promise.allSettled(schedulingPromises);
    await Promise.allSettled(recipeUploads);

  } catch(ex) {
    console.log(ex);
    throw ex;
  }
};

const scheduleExperimentOnServerAgent = async (commonPayload, recipe, clientAgents) => {
  try {
    console.log("Now scheduling for server agent");
    let serverUrl = registry.get("server-agent")["ip"];
    let startTime = recipe["experimentStartTime"];

    let networkPartitionSchedule = recipe["networkPartitionSchedule"].map((entry) => {
      let scheduleEntry = {};
      scheduleEntry["networkPartitioned"] = entry["networkPartitioned"];
      scheduleEntry["time"] = entry["time"] + startTime;

      let accessibleClients = [];

      if(scheduleEntry["networkPartitioned"]) {
        let partitions = entry["partitions"];
        let index = 0;
        for(let partition of partitions) {
          if(!partition["serverAccessible"]) {
            index = index + partition["clientCount"];
          } else {
            for(let i = 0; i < partition["clientCount"]; i++) {
              accessibleClients.push(clientAgents[index]);
              index++;
            }
          }
        }

        accessibleClients.push(serverUrl);

      }

      scheduleEntry["partition"] = accessibleClients;

      return scheduleEntry;
    });

    let serverSchedulingPayload = {
      ...commonPayload,
      "networkPartitionSchedule": networkPartitionSchedule,
      ...recipe["serverConfig"]
    };

    await axios({
        method: "post",
        url: "http://" + serverUrl + "/api/v1/northbound/schedule-experiment",
        headers: {
          "agent-secret": config.AGENT_SECRET
        },
        data: serverSchedulingPayload
      }).then((response) => {
        console.log(serverUrl + " - success in scheduling");
      })
      .catch((err) => {
        console.log(serverUrl + " - sheduling failed");
    });

    await bucket
    .file(recipe["experimentSession"] + '/recipes/' + serverUrl + ".json")
    .save(JSON.stringify(serverSchedulingPayload))
    .then(() => {console.log("Firebase: Recipe uploaded for " + serverUrl)})
    .catch((ex) => {
      console.log(ex);
      console.log("Firebase: Failed to upload recipe for - " + serverUrl);
    });

  } catch(ex) {
    console.log(ex);
    throw ex;
  }
};

module.exports = {
  scheduleExperiment
};