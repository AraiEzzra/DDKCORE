import { SocketClient } from 'shared/driver/socket/client';
import { CORE_SOCKET_CLIENT_CONFIG } from 'shared/config/socket';
import config from 'shared/config';

const coreSocketClient = new SocketClient(
    config.CORE.HOST,
    config.CORE.RPC.PORT,
    config.CORE.RPC.PROTOCOL,
    CORE_SOCKET_CLIENT_CONFIG,
);

export default coreSocketClient.connect();
