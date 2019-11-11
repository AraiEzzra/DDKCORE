import { transports, Logger } from 'winston';
import 'winston-daily-rotate-file';

import config from 'shared/config';

/**
 * @desc custom levels for winston logger
 */
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

class LoggerClass {
    public logger;

    private transport;
    private consoleTransport;
    private traceTransport;

    constructor() {
        if (this.logger) {
            return this;
        }
        this.init();

        this.transport.formatter = (opt) => {
            return `${opt.timestamp()} - [${opt.level}] : ${opt.message}`;
        };
        this.traceTransport.formatter = function (options) {
            return `${options.timestamp()}  - [${options.level}] : ${options.message}`;
        };
        this.consoleTransport.formatter = function (options) {
            return `${options.timestamp()} [${options.level}] ${options.message}`;
        };
        this.logger = new Logger({
            levels,
            transports: [this.traceTransport, this.transport, this.consoleTransport],
        });
    }

    private init() {
        /**
         * @desc Creating file transport to write logs into a file. This file daily rotates
         */
        this.transport = new transports.DailyRotateFile({
            filename: './logs/debug.log',
            datePattern: 'yyyy-MM-dd.',
            prepend: true,
            json: false,
            level: 'debug',
            timestamp: this.timestamp,
            maxFiles: config.LOGGER.MAX_FILES,
        });

        /**
         * @desc creating file transport to write archived logs into a file.
         * @desc Only "archive" logs will be written in this file.
         */
        this.traceTransport = new transports.File({
            filename: './logs/archive.log',
            level: 'archive',
            levelOnly: true,
            prepend: true,
            json: false,
            timestamp: this.timestamp
        });

        this.consoleTransport = new transports.Console({
            level: config.LOGGER.LEVEL || 'info',
            timestamp: this.timestamp
        });
    }

    private timestamp() {
        const today = new Date();
        return today.toISOString();
    }
}

export const logger = new LoggerClass().logger;
