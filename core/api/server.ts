import { CoreRPCSocketServer } from 'core/api/socket';
import { CORE_SOCKET_SERVER_CONFIG } from 'shared/config/socket';
import config from 'shared/config';
import 'core/api/init';

export const socketRPCServer = new CoreRPCSocketServer(config.CORE.RPC.PORT, CORE_SOCKET_SERVER_CONFIG);
