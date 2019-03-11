import { SocketClient } from 'shared/driver/socket';
import { CORE_HOST, CORE_PORT, CORE_PROTOCOL, CORE_SOCKET_CLIENT_CONFIG } from 'shared/config/socket';

const coreSocketClient = new SocketClient(CORE_HOST, CORE_PORT, CORE_PROTOCOL, CORE_SOCKET_CLIENT_CONFIG);

export default coreSocketClient.connect();
