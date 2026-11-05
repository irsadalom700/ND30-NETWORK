/**
 * Entry point for cPanel / Phusion Passenger / Production Hosting
 * Forwards execution to server.js
 */
const app = require('./server.js');
module.exports = app;


