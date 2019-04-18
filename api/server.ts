import { ApiSocketServer } from 'api/socket';
import { API_SOCKET_SERVER_CONFIG } from 'shared/config/socket';
import { logger } from 'shared/util/logger';
import config from 'shared/config';
import 'api/init';

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

const server = new ApiSocketServer(config.API.SOCKET.PORT, API_SOCKET_SERVER_CONFIG);
server.run();

/**
 *  Global error interceptor
 */
process.on('uncaughtException', (err: Error) => {
    logger.error('[ERROR][API].', err.stack);
});
