import Validator from 'z-schema';

import { IConstants } from 'shared/config/types';
import ZSchema from 'shared/validate/z_schema';
import configSchema from 'config/schema';
import developmentConstants from 'config/default/constants';
import testnetConstants from 'config/testnet/constants';
import mainnetConstants from 'config/mainnet/constants';
import developmentGenesisBlock from 'config/default/genesisBlock.json';
import testnetGenesisBlock from 'config/testnet/genesisBlock.json';
import mainnetGenesisBlock from 'config/mainnet/genesisBlock.json';
import testConstants from 'config/test/constants';
import testGenesisBlock from 'config/test/genesisBlock.json';
import { BlockModel } from 'shared/model/block';
import { ERROR_CODES } from 'shared/config/errorCodes';
import { logger } from 'shared/util/logger';

const getConstantsByNodeEnv = (nodeEnv: string): IConstants => {
    switch (nodeEnv) {
        case NODE_ENV_ENUM.DEVELOPMENT:
            return developmentConstants;
        case NODE_ENV_ENUM.TEST:
            return testConstants;
        case NODE_ENV_ENUM.TESTNET:
            return testnetConstants;
        case NODE_ENV_ENUM.MAINNET:
            return mainnetConstants;
        default:
            return null;
    }
};

const getGenesisBlockByNodeEnv = (nodeEnv: string) => {
    switch (nodeEnv) {
        case NODE_ENV_ENUM.DEVELOPMENT:
            return developmentGenesisBlock;
        case NODE_ENV_ENUM.TEST:
            return testGenesisBlock;
        case NODE_ENV_ENUM.TESTNET:
            return testnetGenesisBlock;
        case NODE_ENV_ENUM.MAINNET:
            return mainnetGenesisBlock;
        default:
            return null;
    }
};

export const DEFAULT_CORE_SOCKET_PORT = 7007;
export const DEFAULT_CORE_RPC_PORT = 7009;
export const DEFAULT_API_SOCKET_PORT = 7008;
export const DEFAULT_REQUESTS_PER_SECOND_LIMIT = 5000;
export const DEFAULT_CONSENSUS = 51;

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

export enum NODE_ENV_ENUM {
    DEVELOPMENT = 'development',
    TESTNET = 'testnet',
    MAINNET = 'mainnet',
    TEST = 'test'
}

class Config {
    IS_SECURE: boolean;
    PUBLIC_HOST: string;
    NODE_ENV_IN: NODE_ENV_ENUM;
    CORE: {
        HOST: string;
        SOCKET: {
            PORT: number;
        };
        RPC: {
            PORT: number;
            PROTOCOL: string;
        };
        PEERS: {
            TRUSTED: Array<{ ip: string, port: number }>;
            BLACKLIST: Array<string>;
        };
        FORGING: {
            SECRET: string;
        };
        IS_HISTORY: boolean;
        IS_HISTORY_ON_WARMUP: boolean;
        HISTORY: {
            BLOCKS: boolean,
            ACCOUNTS: boolean,
            TRANSACTIONS: boolean,
        };
        IS_DISABLED_TRANSACTION_CREATION: boolean;
        IS_REFERRED_USERS_ENABLED: boolean;
        VERSION: string;
        MIN_VERSION: string;
        MIN_CONSENSUS: number;
        LOG_LEVEL: string;
    };
    API: {
        REQUESTS_PER_SECOND_LIMIT: number;
        SOCKET: {
            PORT: number;
            HOST: string;
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

        this.IS_SECURE = process.env.IS_SECURE === 'TRUE';
        this.PUBLIC_HOST = process.env.PUBLIC_HOST || process.env.SERVER_HOST;
        this.NODE_ENV_IN = (process.env.NODE_ENV_IN as NODE_ENV_ENUM) || NODE_ENV_ENUM.DEVELOPMENT;
        this.DB = {
            ...DEFAULT_DB_CONFIGS,
            HOST: process.env.DB_HOST,
            PORT: Number(process.env.DB_PORT) || DEFAULT_DB_CONFIGS.PORT,
            DATABASE: process.env.DB_NAME,
            USER: process.env.DB_USER,
            PASSWORD: process.env.DB_PASSWORD,
        };
        this.CORE = {
            HOST: process.env.CORE_HOST || 'localhost',
            SOCKET: {
                PORT: Number(process.env.PORT) || DEFAULT_CORE_SOCKET_PORT,
            },
            RPC: {
                PROTOCOL: process.env.CORE_RPC_PROTOCOL || 'ws',
                PORT: Number(process.env.CORE_RPC_PORT) || DEFAULT_CORE_RPC_PORT,
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
            IS_HISTORY: process.env.IS_HISTORY === 'TRUE',
            IS_HISTORY_ON_WARMUP: process.env.IS_HISTORY_ON_WARMUP === 'TRUE',
            HISTORY: {
                BLOCKS: process.env.IS_BLOCKS_HISTORY === 'TRUE',
                ACCOUNTS: process.env.IS_ACCOUNTS_HISTORY === 'TRUE',
                TRANSACTIONS: process.env.IS_TRANSACTIONS_HISTORY === 'TRUE',
            },
            IS_DISABLED_TRANSACTION_CREATION: process.env.IS_DISABLED_TRANSACTION_CREATION === 'TRUE',
            IS_REFERRED_USERS_ENABLED: process.env.IS_REFERRED_USERS_ENABLED  === 'TRUE',
            VERSION: '1.2.0',
            MIN_VERSION: '1.0.2',
            MIN_CONSENSUS: Number(process.env.MIN_CONSENSUS) || DEFAULT_CONSENSUS,
            LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        };
        this.API = {
            REQUESTS_PER_SECOND_LIMIT: Number(process.env.REQUESTS_PER_SECOND_LIMIT) ||
                DEFAULT_REQUESTS_PER_SECOND_LIMIT,
            SOCKET: {
                PORT: Number(process.env.API_PORT) || DEFAULT_API_SOCKET_PORT,
                HOST: process.env.API_HOST || 'localhost'
            },
        };

        this.CONSTANTS = getConstantsByNodeEnv(this.NODE_ENV_IN);
        this.GENESIS_BLOCK = getGenesisBlockByNodeEnv(this.NODE_ENV_IN) as any;

        let lastHeight = -1;
        for (const [height] of this.CONSTANTS.ACTIVE_DELEGATES) {
            if (height <= lastHeight) {
                throw `Invalid active delegates config. Height should only increase`;
            }
            lastHeight = height;
        }

        const validator: Validator = new ZSchema({});
        validator.validate(this, configSchema, (err, valid) => {
            if (!valid) {
                throw `Config is invalid: ${err}`;
            }
        });
    }
}

export default new Config();
