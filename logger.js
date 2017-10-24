var winston = require('winston');
require('winston-daily-rotate-file');
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
  trace: 7
};

var transport = new (winston.transports.DailyRotateFile)({
  filename: 'logs/./log',
  datePattern: 'yyyy-MM-dd.',
  prepend: true,
  json: false,
  level: process.env.ENV === 'development' ? 'debug' : 'info'
});

var logger = new (winston.Logger)({
  levels: levels,
  transports: [
    transport
  ]
});

module.exports = logger;