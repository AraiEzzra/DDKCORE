import { BlockModel } from 'shared/model/block';
import { ed } from 'shared/util/ed';
import crypto from 'crypto';

import Validator from 'z-schema';
import ZSchema from 'shared/validate/z_schema';
import configSchema from '../../config/schema/config';
import defaultCfg from '../../config/default/config';
import testnetCfg from '../../config/testnet/config';
import mainnetCfg from '../../config/mainnet/config';
import envConstants from '../../config/env';
import devConstants from '../../config/default/constants';
import testConstants from '../../config/testnet/constants';
import mainConstants from '../../config/mainnet/constants';
import defaultGenesisBlock from '../../config/default/genesisBlock.json';
import testnetGenesisBlock from '../../config/testnet/genesisBlock.json';
import mainnetGenesisBlock from '../../config/mainnet/genesisBlock.json';

const env = process.env;

const validator: Validator = new ZSchema({});

interface IConstraint {
    SLOT_INTERVAL: number;
    REQUEST_BLOCK_LIMIT: number;
    serverHost?: string;
    serverPort?: number;
    publicKey?: string;
    airdrop?: {
        account?: bigint;
        stakeRewardPercent?: number;
        referralPercentPerLevel?: Array<number>;
        maxReferralCount: number;
    };
    blockSlotWindow?: number;
    activeDelegates?: number;
    maxVotes?: number;
    maxVotesPerTransaction?: number;
    maxTransferCount?: number;
    maxDelegateUsernameLength?: number;
    addressLength?: number;
    blockHeaderLength?: number;
    blockReceiptTimeOut?: number;
    confirmationLength?: number;
    epochTime?: number;
    fees?: {
        send?: number;
        vote?: number;
        secondsignature?: number;
        delegate?: number;
        multisignature?: number;
        dapp?: number;
        froze?: number;
        sendfreeze?: number;
        reward?: number;
    };
    feeStart?: number;
    feeStartVolume?: number;
    fixedPoint?: number;
    maxAddressesLength?: number;
    maxAmount?: number;
    maxConfirmations?: number;
    maxPayloadLength?: number;
    maxPeers?: number;
    maxRequests?: number;
    maxSharedTxs?: number;
    maxSignaturesLength?: number;
    maxTxsPerBlock?: number;
    nethashes?: Array<string>;
    nethash?: string;
    numberLength?: number;
    requestLength?: number;
    rewards?: {
        milestones?: Array<number>;
        offset?: number;
        distance?: number;
    };
    signatureLength?: number;
    totalAmount?: number;
    unconfirmedTransactionTimeOut?: number;
    multisigConstraints?: {
        min?: {
            minimum?: number;
            maximum?: number;
        };
        lifetime?: {
            minimum?: number;
            maximum?: number;
        };
        keysgroup?: {
            minItems?: number;
            maxItems?: number;
        };
    };
    froze?: {
        endTime?: number;
        rTime?: number;
        vTime?: number;
        milestone?: number;
        rewards?: {
            milestones?: Array<number>;
            distance?: number;
        };
        rewardVoteCount?: number;
        unstakeVoteCount?: number;
    };
    defaultLock?: number;
    TemplateId?: {
        referralMail?: number;
        welcomeMail?: number;
    };
    NODE_ENV_IN?: string;
    PREVIOUS_DELEGATES_COUNT?: number;
    MASTER_NODE_MIGRATED_BLOCK?: number;
    CURRENT_BLOCK_VERSION?: number;
    MAX_RELAY: number;
    DEFAULT_USERS?: Object;
}

interface IConfig {
    port?: number;
    address?: string;
    serverProtocol?: string;
    serverHost?: string;
    serverPort?: number;
    serverUrl?: string;
    version?: string;
    minVersion?: string;
    fileLogLevel?: string;
    logFileName?: string;
    consoleLogLevel?: string;
    trustProxy?: boolean;
    topAccounts?: boolean;
    cacheEnabled?: boolean;
    db?: {
        host?: string;
        port?: number;
        database?: string;
        password?: string;
        user?: string;
        poolSize?: number;
        poolIdleTimeout?: number;
        reapIntervalMillis?: number;
        logEvents?: Array<string>;
    };
    api?: {
        enabled?: boolean;
        access?: {
            public?: boolean;
            whiteList?: Array<string>;
        };
        options?: {
            limits?: {
                max?: number;
                delayMs?: number;
                delayAfter?: number;
                windowMs?: number;
            }
        }
    };
    peers?: {
        enabled?: boolean;
        list?: Array<Object>,
        access?: {
            blackList?: Array<string>,
        };
        options?: {
            limits?: {
                max?: number;
                delayMs?: number;
                delayAfter?: number;
                windowMs?: number;
            };
            timeout?: number;
        };
    };
    broadcasts?: {
        broadcastInterval?: number;
        broadcastLimit?: number;
        parallelLimit?: number;
        releaseLimit?: number;
        relayLimit?: number;
    };
    transactions?: {
        maxTxsPerQueue?: number;
    };
    forging?: {
        force?: boolean;
        minBroadhashConsensus?: number;
        secret?: string,
        access?: {
            whiteList?: Array<string>
        };
        totalSupplyAccount?: bigint;
    };
    loading?: {
        verifyOnLoading?: boolean;
        loadPerIteration?: number;
        snapshotRound?: number;
    };
    ssl?: {
        enabled?: boolean;
        options?: {
            port?: number;
            address?: string;
            key?: string;
            cert?: string;
        }
    };
    dapp?: {
        masterrequired?: boolean;
        autoexec?: Array<string>;
        masterpassword?: string;
    };
    initialPrimined?: {
        total?: number;
    };
    ddkSupply?: {
        totalSupply?: number;
    };
    session?: {
        secret?: string;
    };
    app?: Object;
    sender?: Object;
    nethash?: string;
    elasticsearchHost?: string;
    elasticsearch?: {
        disableJobs?: boolean;
    };
    jwt?: {
        secret?: string;
        tokenLife?: number;
    };
    mailFrom?: string;
    hashSecret?: string;
    users?: Array<Object>;
    coverage? : boolean;
}

/**
 * @implements {validateForce}
 * @returns {Object} config
 */
class Config {
    public config: IConfig;
    public constants: IConstraint;
    public genesisBlock: BlockModel & { transactions: any }; // todo change it to serialized Block

    constructor() {
        if (!env.NODE_ENV_IN) {
            throw 'env config should be present';
        }

        this.constants = {
            SLOT_INTERVAL: 10,
            REQUEST_BLOCK_LIMIT: 42,
            NODE_ENV_IN: env.NODE_ENV_IN,
            PREVIOUS_DELEGATES_COUNT: 3,
            MASTER_NODE_MIGRATED_BLOCK: 0,
            CURRENT_BLOCK_VERSION: 1,
            MAX_RELAY: 3,

            DEFAULT_USERS: {
                DDK4995063339468361088: 'DSTAKEREWARD',
                DDK15546849747111093123: 'DPENDINGGB',
                DDK5143663806878841341: 'DCONTRIBUTOR',
                DDK14224602569244644359: 'DADVISOR',
                DDK9758601670400927807: 'DTEAM',
                DDK12671171770945235882: 'DFOUNDER',
                DDK10720340277000928808: 'DAIRDROP',
                DDK5216737955302030643: 'DRESERVEDEX',
                DDK8999840344646463126: 'DPREORDERDNC',
                DDK7214959811294852078: 'DBOUNTY',
            },
        };

        Object.assign(this.constants, envConstants);

        // For development mode
        if (env.NODE_ENV_IN === 'development') {
            this.config = defaultCfg;
            this.genesisBlock = defaultGenesisBlock as any;
            Object.assign(this.constants, devConstants);
        }

        // For staging environment
        if (env.NODE_ENV_IN === 'testnet') {
            this.genesisBlock = testnetGenesisBlock as any;
            this.config = testnetCfg;
            Object.assign(this.constants, testConstants);
        }

        // For production
        if (env.NODE_ENV_IN === 'mainnet') {
            this.genesisBlock = mainnetGenesisBlock as any;
            this.config = mainnetCfg;
            Object.assign(this.constants, mainConstants);
        }

        if (env.NODE_ENV_IN === 'test') {
            this.genesisBlock = testnetGenesisBlock as any;
            this.config = { ...defaultCfg, coverage: true };
            Object.assign(this.constants, testConstants);
        }

        const valid = validator.validate(this.config, configSchema.config);

        if (!valid) {
            process.exit(1);
        } else {
            this.config = this.validateForce(this.config, this.constants);
        }

        const hash = crypto.createHash('sha256').update(env.FORGE_SECRET, 'utf8').digest();
        const publicKey = ed.makeKeyPair(hash).publicKey.toString('hex');
        Object.assign(this.constants, {publicKey: publicKey});

    }

    /**
     * Validates nethash value from constants and sets forging force to false if any.
     * @private
     * @param {Object} config
     */
    private validateForce(config, constants) {
        if (config.forging.force) {

            const index = constants.nethashes.indexOf(config.nethash);

            if (index !== -1) {
                config.forging.force = false;
            }
        }
        return config;
    }
}

export default new Config();
