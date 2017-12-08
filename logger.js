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
  level: process.env.ENV === 'development' ? 'debug' : 'info',
  timestamp: function() {
    let today = new Date();
    return today.toISOString();
  }
});

class Logger {
  constructor(sessionId, address) {
    this.transport = transport;
    this.transport.formatter = function(options) {
      if(sessionId && address) {
        return options.timestamp() +' - '+sessionId +' - ' + address +' - ['+ options.level +'] : '+ options.message;
      }else if(sessionId) {
        return options.timestamp() +' - '+sessionId +' - ['+ options.level +'] : '+ options.message;
      }else if(address) {
        return options.timestamp() +' - '+address +' - ['+ options.level +'] : '+ options.message;
      }else {
        return options.timestamp() +'  - ['+ options.level +'] : '+ options.message;
      }
    };
    this.logger = new (winston.Logger)({
      levels: levels,
      transports: [this.transport]
    });
  }
}

module.exports = Logger;