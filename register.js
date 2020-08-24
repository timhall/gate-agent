const http = require("http");
const https = require("https");
const { GateAgent } = require(".");

const agent = new GateAgent();

http.globalAgent = agent;
https.globalAgent = agent;
