const AppError = require("../utils/appError")
const config = require("../utils/config");

const NodeCache = require("node-cache");

console.log("Initializing agent registry");

const agentRegistry = new NodeCache({checkperiod: config.RECORD_TTL});

agentRegistry.on("expired", ( key, value ) => {
  if(key == "server-agent") {
    console.log("Server-agent incommunicado - " + value.ip);
  } else {
    console.log("Client-agent incommunicado - " + key);
  }
});

const set = (key, value) => {
  const success = agentRegistry.set(key, value, config.RECORD_TTL);
  if(!success) throw AppError("Agent registration/update failed", 500);
}

const get = (key) => {

  let value = agentRegistry.get(key);

  if(value == undefined) {
    return null;
  } else {
    return value;
  }

}

const getRegisteredAgentInformation = () => {
  let keys = agentRegistry.keys();
  let agentInformation = agentRegistry.mget(keys);
  return agentInformation;  
}

const keys = () => {
  return agentRegistry.keys();
}

module.exports = {
  set,
  get,
  getRegisteredAgentInformation,
  keys
}