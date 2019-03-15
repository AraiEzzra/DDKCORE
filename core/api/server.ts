import { SocketServerAPI } from 'core/api/socket';
import { API_SOCKET_SERVER_CONFIG, CORE_API_SOCKET_PORT } from 'shared/config/socket';

const server = new SocketServerAPI(CORE_API_SOCKET_PORT, API_SOCKET_SERVER_CONFIG);

export const socketAPI = server;
