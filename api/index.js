const serverless = require('serverless-http');
const app = require('../server/Server.js');

// Wrap the Express app for serverless
module.exports.handler = serverless(app);
