import { CoreRPCSocketServer } from 'core/api/socket';
import { CORE_RPC_PORT, CORE_SOCKET_SERVER_CONFIG } from 'shared/config/socket';

export const socketRPCServer = new CoreRPCSocketServer(CORE_RPC_PORT, CORE_SOCKET_SERVER_CONFIG);
