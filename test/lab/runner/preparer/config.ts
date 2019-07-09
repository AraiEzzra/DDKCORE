import { IConstants } from 'shared/config/types';

const NEVER = 1005000000;

export const PEER = {
    ONE: { ip: '10.10.0.5', port: 7007 },
    TWO: { ip: '10.11.0.5', port: 7007 },
    TEST: { ip: '10.12.0.5', port: 7007 },
};

export const CUSTOM_CONFIG: IConstants | any = {
    PEER_CONNECTION_TIME_INTERVAL_REBOOT: {
        MAX: NEVER + NEVER,
        MIN: NEVER
    },
    PEERS_DISCOVER: {
        MIN: 0
    },
    CORE: {
        PEERS: {
            TRUSTED: [],
        },
    },
    MAX_PEERS_CONNECT_TO: 2,
    MAX_PEERS_CONNECTED: 3,
    TIMEOUT_START_SYNC_BLOCKS: NEVER,
    TIMEOUT_START_PEER_REQUEST: NEVER,
    TIMEOUT_START_PEER_CONNECT: NEVER,
};

