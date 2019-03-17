import { CoreApiSocketServer } from 'core/api/socket';
import { API_SOCKET_SERVER_CONFIG, CORE_RPC_PORT } from 'shared/config/socket';

export const socketRPCServer = new CoreApiSocketServer(CORE_RPC_PORT, API_SOCKET_SERVER_CONFIG);
