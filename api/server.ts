import { ApiSocketServer } from 'api/socket';
import { API_SOCKET_PORT, API_SOCKET_SERVER_CONFIG } from 'shared/config/socket';
import {logger} from 'shared/util/logger';

const server = new ApiSocketServer(API_SOCKET_PORT, API_SOCKET_SERVER_CONFIG);
server.run();

/**
 *  Global error interceptor
 */
process.on('uncaughtException', (err: Error) => {
    logger.error('[ERROR][API].', err.stack);
});
