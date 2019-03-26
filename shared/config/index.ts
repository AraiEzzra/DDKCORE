import Validator from 'z-schema';

import { IConstants } from 'shared/model/types';
import ZSchema from 'shared/util/z_schema';
import configSchema from 'config/schema';
import developmentConstants from 'config/default/constants';
import testnetConstants from 'config/testnet/constants';
import mainnetConstants from 'config/mainnet/constants';
import developmentGenesisBlock from 'config/default/genesisBlock.json';
import testnetGenesisBlock from 'config/testnet/genesisBlock.json';
import mainnetGenesisBlock from 'config/mainnet/genesisBlock.json';
import { BlockModel } from 'shared/model/block';

const getConstantsByNodeEnv = (nodeEnv: string): IConstants => {
    switch (nodeEnv) {
        case 'development':
            return developmentConstants;
        case 'testnet':
            return testnetConstants;
        case 'mainnet':
            return mainnetConstants;
        default:
            return null;
    }
};

const getGenesisBlockByNodeEnv = (nodeEnv: string) => {
    switch (nodeEnv) {
        case 'development':
            return developmentGenesisBlock;
        case 'testnet':
            return testnetGenesisBlock;
        case 'mainnet':
            return mainnetGenesisBlock;
        default:
            return null;
    }
};

export const DEFAULT_CORE_SOCKET_PORT = 7007;
export const DEFAULT_CORE_RPC_PORT = 7009;
export const DEFAULT_API_SOCKET_PORT = 7008;
const DEFAULT_DB_CONFIGS = {
    HOST: '0.0.0.0',
    PORT: 5432,
    DATABASE: 'ddk_test',
    USER: 'postgres',
    PASSWORD: 'postgres',
    POOL_SIZE: 95,
    POOL_IDLE_TIMEOUT: 30000,
    REAP_INTERVAL_MILLIS: 1000,
    LOG_EVENTS: ['error'],
};

class Config {
    IS_SECURE: boolean;
    PUBLIC_HOST: string;
    NODE_ENV_IN: string;
    CORE: {
        SOCKET: {
            PORT: number;
        };
        PEERS: {
            TRUSTED: Array<{ ip: string, port: number }>;
            BLACKLIST: Array<string>;
        };
        FORGING: {
            SECRET: string;
        };
    };
    API: {
        SOCKET: {
            PORT: number;
        };
    };
    DB: {
        HOST: string;
        PORT: number;
        DATABASE: string;
        USER: string;
        PASSWORD: string;
        POOL_SIZE: number;
        POOL_IDLE_TIMEOUT: number;
        REAP_INTERVAL_MILLIS: number;
        LOG_EVENTS: Array<string>;
    };
    CONSTANTS: IConstants;
    GENESIS_BLOCK: BlockModel & { transactions: any }; // TODO: Change it to serialized Block

    constructor() {
        if (!process.env.NODE_ENV_IN) {
            throw 'env config should be present';
        }
        const validator: Validator = new ZSchema({});

        this.IS_SECURE = process.env.IS_SECURE === 'TRUE' || false;
        this.PUBLIC_HOST = process.env.SERVER_HOST;
        this.NODE_ENV_IN = process.env.NODE_ENV_IN || 'development';
        this.DB = {
            ...DEFAULT_DB_CONFIGS,
            HOST: process.env.DB_HOST,
            PORT: Number(process.env.DB_PORT) || DEFAULT_DB_CONFIGS.PORT,
            DATABASE: process.env.DB_NAME,
            USER: process.env.DB_USER,
            PASSWORD: process.env.DB_PASSWORD,
        };
        this.CORE = {
            SOCKET: {
                PORT: Number(process.env.PORT) || DEFAULT_CORE_SOCKET_PORT,
            },
            FORGING: {
                SECRET: process.env.FORGE_SECRET,
            },
            PEERS: {
                TRUSTED: (process.env.PEERS || '')
                    .split(',')
                    .map(peer => peer.split(':'))
                    .map(([ip, port]: [string, string]) => ({ ip, port: Number(port) })),
                BLACKLIST: (process.env.PEERS_BLACKLIST || '').split(','),
            },
        };
        this.API = {
            SOCKET: {
                PORT: Number(process.env.API_PORT) || DEFAULT_API_SOCKET_PORT,
            },
        };

        this.CONSTANTS = getConstantsByNodeEnv(this.NODE_ENV_IN);
        this.GENESIS_BLOCK = getGenesisBlockByNodeEnv(this.NODE_ENV_IN) as any;

        const valid = validator.validate(this, configSchema);

        if (!valid) {
            throw 'config is invalid';
        }
    }
}

export default new Config();
