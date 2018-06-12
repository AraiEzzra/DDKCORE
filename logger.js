

// modified logger configuration
//requiring dependencies
let winston = require('winston');
require('winston-daily-rotate-file');

//defined custom log levels for winston logger
const levels = {
	archive: 0,
	error: 1,
	warn: 2,
	info: 3,
	http: 4,
	verbose: 5,
	debug: 6,
	silly: 7,
	trace: 8,
};

//Creating file transport to write logs into a file. This file daily rotates
let transport = new (winston.transports.DailyRotateFile)({
	filename: 'logs/./log',
	datePattern: 'yyyy-MM-dd.',
	prepend: true,
	json: false,
	level: process.env.ENV === 'development' ? 'debug' : 'info',
	timestamp: function () {
		let today = new Date();
		return today.toISOString();
	}
});

//creating file transport to write archived logs into a file. Only "archive" logs will be written in this file
let traceTransport = new (winston.transports.File)({
	filename: './logs/archive.log',
	level: 'archive',
	levelOnly: true,
	prepend: true,
	json: false,
	timestamp: function () {
		let today = new Date();
		return today.toISOString();
	}
});

//Logger constructor
class Logger {
	constructor(sessionId, address) {
		this.transport = transport;
		this.transport.formatter = function (options) {
			if (sessionId && address) {
				return options.timestamp() + ' - ' + sessionId + ' - ' + address + ' - [' + options.level + '] : ' + options.message;
			} else if (sessionId) {
				return options.timestamp() + ' - ' + sessionId + ' - [' + options.level + '] : ' + options.message;
			} else if (address) {
				return options.timestamp() + ' - ' + address + ' - [' + options.level + '] : ' + options.message;
			} else {
				return options.timestamp() + '  - [' + options.level + '] : ' + options.message;
			}
		};
		this.traceTransport = traceTransport;
		this.traceTransport.formatter = function (options) {
			return options.timestamp() + '  - [' + options.level + '] : ' + options.message;
		};
		this.logger = new (winston.Logger)({
			levels: levels,
			transports: [this.traceTransport, this.transport]
		});
	}
}

module.exports = Logger;