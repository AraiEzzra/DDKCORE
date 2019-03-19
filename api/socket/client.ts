import { SocketClient } from 'shared/driver/socket/client';
import { CORE_HOST, CORE_RPC_PROTOCOL, CORE_RPC_PORT, CORE_SOCKET_CLIENT_CONFIG } from 'shared/config/socket';

const coreSocketClient = new SocketClient(CORE_HOST, CORE_RPC_PORT, CORE_RPC_PROTOCOL, CORE_SOCKET_CLIENT_CONFIG);

export default coreSocketClient.connect();
