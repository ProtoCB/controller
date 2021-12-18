const http = require('http');
const app = require('./app');
const config = require('./utils/config');
const server = http.createServer(app);

console.log('Starting ProtoCB Controller');

server.listen(config.PORT, () => {
  console.log(`Controller is running on port ${config.PORT}`);
});