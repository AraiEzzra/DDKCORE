const env = process.env;

import Validator from 'z-schema';
import ZSchema from 'shared/util/z_schema';
const validator: Validator = new ZSchema({});

import configSchema from 'config/schema/config';
import devConfig from 'config/default/config';
import testConfig from 'config/testnet/config';
import mainConfig from 'config/mainnet/config';
import envConstants from 'config/env';
import devConstants from 'config/default/constants';
import testConstants from 'config/testnet/constants';
import mainConstants from 'config/mainnet/constants';
import defaultGenesisBlock from 'config/default/genesisBlock.json';
import testnetGenesisBlock from 'config/testnet/genesisBlock.json';
import mainnetGenesisBlock from 'config/mainnet/genesisBlock.json';
import { Block } from 'shared/model/block';

interface IConstraint {
    airdrop?: {
        account?: string;
        stakeRewardPercent?: number;
        referralPercentPerLevel?: Array<number>;
    };
    blockSlotWindow?: number;
    activeDelegates?: number;
    maxVotes?: number;
    maxVotesPerTransaction?: number;
    maxTransferCount?: number;
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
    VERIFY_BLOCK_VERSION?: boolean;
    VERIFY_BLOCK_SIGNATURE?: boolean;
    VERIFY_BLOCK_ID?: boolean;
    VERIFY_BLOCK_PAYLOAD?: boolean;
    PAYLOAD_VALIDATE?: {
        MAX_LENGTH?: boolean;
        MAX_TRANSACTION_LENGTH?: boolean;
        MAX_TRANSACTION_IN_BLOCK?: boolean;
        MAX_TRANSACTION_DUPLICATE?: boolean;
        INVALID_HASH?: boolean;
        TOTAL_AMOUNT?: boolean;
        TOTAL_FEE?: boolean;
    };
    VERIFY_INVALID_BLOCK_TIMESTAMP?: boolean;
    VERIFY_PREVIOUS_BLOCK?: boolean;
    VERIFY_AGAINST_LAST_N_BLOCK_IDS?: boolean;
    VERIFY_BLOCK_FORK_ONE?: boolean;
    VERIFY_BLOCK_REWARD?: boolean;
    VERIFY_BLOCK_SLOT?: boolean;
    VERIFY_BLOCK_SLOT_WINDOW?: boolean;
    VALIDATE_BLOCK_SLOT?: boolean;
    VERIFY_DELEGATE_TRS_RECIPIENT?: boolean;
    VERIFY_DELEGATE_TRS_AMOUNT?: boolean;
    VERIFY_DELEGATE_TRS_IS_DELEGATE?: boolean;
    VERIFY_DELEGATE_TRS_U_IS_DELEGATE?: boolean;
    VERIFY_DELEGATE_TRS_ASSET?: boolean;
    VERIFY_DELEGATE_USERNAME?: boolean;
    VERIFY_DELEGATE_USERNAME_LOWERCASE?: boolean;
    VERIFY_DELEGATE_EMPTY_USERNAME?: boolean;
    VERIFY_DELEGATE_USERNAME_LENGTH?: boolean;
    VERIFY_DELEGATE_USERNAME_ALPHANUMERIC_CHARACTERS?: boolean;
    VOTE_VALIDATION_ENABLED?: {
        INVALID_RECIPIENT?: boolean;
        INVALID_TRANSACTION_ASSET?: boolean;
        INVALID_VOTES_MUST_BE_ARRAY?: boolean;
        INVALID_VOTES_EMPTY_ARRAY?: boolean;
        VOTING_LIMIT_EXCEEDED?: boolean;
        INVALID_VOTE_AT_INDEX?: boolean;
        MULTIPLE_VOTES_FOR_SAME_DELEGATE?: boolean;
        VOTE_REWARD_CORRUPTED?: boolean;
        VOTE_UNSTAKE_CORRUPTED?: boolean;
        PAYLOAD_HASH?: boolean;
        VOTE_AIRDROP_CORRUPTED?: boolean;
    };
    STAKE_VALIDATE?: {
        AMOUNT_ENABLED?: boolean;
        BALANCE_ENABLED?: boolean;
        AIRDROP_ENABLED?: boolean;
    };
    REWARD_VALIDATE?: {
        RECIPIENT_ID_ENABLED?: boolean;
        TRANSACTION_AMOUNT_ENABLED?: boolean;
        REWARD_PER_ENABLED?: boolean;
    };
    SEND_TRANSACTION_VALIDATION_ENABLED?: {
        AMOUNT?: boolean;
        RECIPIENT_ID?: boolean;
    };
    REFERRAL_TRANSACTION_VALIDATION_ENABLED?: {
        GLOBAL_ACCOUNT?: boolean;
    };
    SIGNATURE_TRANSACTION_VALIDATION_ENABLED?: {
        SIGNATURE?: boolean;
        AMOUNT?: boolean;
        PUBLIC_KEY?: boolean;
    };
    SENDSTAKE_VERIFICATION?: {
        VERIFY_RECIPIENT_ID_ENABLED?: boolean;
        VERIFY_BALANCE_ENABLED?: boolean;
        VERIFY_ACTIVE_FROZE_ORDER_EXIST_ENABLED?: boolean;
        VERIFY_ACTIVE_FROZE_ORDER_TRANSFERCOUNT_ENABLED?: boolean;

    };
    TRANSACTION_VALIDATION_ENABLED?: {
        SENDER?: boolean;
        TYPE?: boolean;
        SECOND_SIGNATURE?: boolean;
        SENDER_SECOND_SIGNATURE?: boolean;
        REQUEST_SECOND_SIGNATURE?: boolean;
        CHECKING_REQUEST_SECOND_SIGNATURE?: boolean;
        SENDER_PUBLIC_KEY?: boolean;
        SENDER_GENESIS_ACCOUNT?: boolean;
        SENDER_ADDRESS?: boolean;
        KEYSGROUP_MEMBER?: boolean;
        MULTISIGNATURE_GROUP?: boolean;
        VERIFY_TRANSACTION_SIGNATURE?: boolean;
        VERIFY_TRANSACTION_SECOND_SIGNATURE?: boolean;
        VERIFY_TRANSACTION_SIGNATURE_UNIQUE?: boolean;
        VERIFY_TRANSACTION_MULTISIGNATURE?: boolean;
        VERIFY_TRANSACTION_FEE?: boolean;
        VERIFY_TRANSACTION_AMOUNT?: boolean;
        VERIFY_SENDER_BALANCE?: boolean;
        VERIFY_TRANSACTION_TIMESTAMP?: boolean;
        VERIFY_TRANSACTION_TYPE?: boolean;
        VERIFY_TRANSACTION_CONFIRMED?: boolean;
    };
    BROADHASH_VALIDATION_ENABLED?: boolean;
    ONLY_FROZEN_PEERS_ENABLED?: boolean;
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
    public genesisBlock: Block;

    constructor() {
        if (!env.NODE_ENV_IN) {
            throw 'env config should be present';
        }

        this.constants = {
            NODE_ENV_IN: env.NODE_ENV_IN,
            PREVIOUS_DELEGATES_COUNT: 3,
            MASTER_NODE_MIGRATED_BLOCK: 0,
            CURRENT_BLOCK_VERSION: 1,
            // Block verify
            VERIFY_BLOCK_VERSION: true,
            VERIFY_BLOCK_SIGNATURE: true,
            VERIFY_BLOCK_ID: true,
            VERIFY_BLOCK_PAYLOAD: true,
            PAYLOAD_VALIDATE: {
                MAX_LENGTH: true,
                MAX_TRANSACTION_LENGTH: true,
                MAX_TRANSACTION_IN_BLOCK: true,
                MAX_TRANSACTION_DUPLICATE: true,
                INVALID_HASH: true,
                TOTAL_AMOUNT: true,
                TOTAL_FEE: true,
            },
            VERIFY_INVALID_BLOCK_TIMESTAMP: true,
            VERIFY_PREVIOUS_BLOCK: true,
            VERIFY_AGAINST_LAST_N_BLOCK_IDS: true,
            VERIFY_BLOCK_FORK_ONE: true,
            VERIFY_BLOCK_REWARD: true,
            VERIFY_BLOCK_SLOT: false,
            VERIFY_BLOCK_SLOT_WINDOW: true,
            VALIDATE_BLOCK_SLOT: false,

            // Delegates transaction verify
            VERIFY_DELEGATE_TRS_RECIPIENT: true,
            VERIFY_DELEGATE_TRS_AMOUNT: true,
            VERIFY_DELEGATE_TRS_IS_DELEGATE: true,
            VERIFY_DELEGATE_TRS_U_IS_DELEGATE: true,
            VERIFY_DELEGATE_TRS_ASSET: true,
            VERIFY_DELEGATE_USERNAME: true,
            VERIFY_DELEGATE_USERNAME_LOWERCASE: true,
            VERIFY_DELEGATE_EMPTY_USERNAME: true,
            VERIFY_DELEGATE_USERNAME_LENGTH: true,
            VERIFY_DELEGATE_USERNAME_ALPHANUMERIC_CHARACTERS: true,

            VOTE_VALIDATION_ENABLED: {
                INVALID_RECIPIENT: true,
                INVALID_TRANSACTION_ASSET: true,
                INVALID_VOTES_MUST_BE_ARRAY: true,
                INVALID_VOTES_EMPTY_ARRAY: true,
                VOTING_LIMIT_EXCEEDED: true,
                INVALID_VOTE_AT_INDEX: true,
                MULTIPLE_VOTES_FOR_SAME_DELEGATE: true,
                VOTE_REWARD_CORRUPTED: true,
                VOTE_UNSTAKE_CORRUPTED: true,
                PAYLOAD_HASH: true,
                VOTE_AIRDROP_CORRUPTED: true,
            },
            STAKE_VALIDATE: {
                AMOUNT_ENABLED: true,
                BALANCE_ENABLED: true,
                AIRDROP_ENABLED: true,
            },
            REWARD_VALIDATE: {
                RECIPIENT_ID_ENABLED: true,
                TRANSACTION_AMOUNT_ENABLED: true,
                REWARD_PER_ENABLED: true,
            },
            SEND_TRANSACTION_VALIDATION_ENABLED: {
                AMOUNT: true,
                RECIPIENT_ID: true
            },
            REFERRAL_TRANSACTION_VALIDATION_ENABLED: {
                GLOBAL_ACCOUNT: true
            },
            SIGNATURE_TRANSACTION_VALIDATION_ENABLED: {
                SIGNATURE: true,
                AMOUNT: true,
                PUBLIC_KEY: true
            },
            SENDSTAKE_VERIFICATION: {
                VERIFY_RECIPIENT_ID_ENABLED: true,
                VERIFY_BALANCE_ENABLED: true,
                VERIFY_ACTIVE_FROZE_ORDER_EXIST_ENABLED: true,
                VERIFY_ACTIVE_FROZE_ORDER_TRANSFERCOUNT_ENABLED: true

            },
            TRANSACTION_VALIDATION_ENABLED: {
                SENDER: true,
                TYPE: true,
                SECOND_SIGNATURE: true,
                SENDER_SECOND_SIGNATURE: true,
                REQUEST_SECOND_SIGNATURE: true,
                CHECKING_REQUEST_SECOND_SIGNATURE: true,
                SENDER_PUBLIC_KEY: true,
                SENDER_GENESIS_ACCOUNT: true,
                SENDER_ADDRESS: true,
                KEYSGROUP_MEMBER: true,
                MULTISIGNATURE_GROUP: true,
                VERIFY_TRANSACTION_SIGNATURE: true,
                VERIFY_TRANSACTION_SECOND_SIGNATURE: true,
                VERIFY_TRANSACTION_SIGNATURE_UNIQUE: true,
                VERIFY_TRANSACTION_MULTISIGNATURE: true,
                VERIFY_TRANSACTION_FEE: false,
                VERIFY_TRANSACTION_AMOUNT: true,
                VERIFY_SENDER_BALANCE: true,
                VERIFY_TRANSACTION_TIMESTAMP: true,
                VERIFY_TRANSACTION_TYPE: true,
                VERIFY_TRANSACTION_CONFIRMED: true,
            },
            BROADHASH_VALIDATION_ENABLED: true,
            ONLY_FROZEN_PEERS_ENABLED: true,
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
            this.config = devConfig;
            this.genesisBlock = new Block(defaultGenesisBlock);
            Object.assign(this.constants, devConstants);
        }

        // For staging environment
        if (env.NODE_ENV_IN === 'testnet') {
            this.genesisBlock = new Block(testnetGenesisBlock);
            this.config = testConfig;
            Object.assign(this.constants, testConstants);
        }

        // For production
        if (env.NODE_ENV_IN === 'mainnet') {
            this.genesisBlock = new Block(mainnetGenesisBlock);
            this.config = mainConfig;
            Object.assign(this.constants, mainConstants);
        }

        if (env.NODE_ENV_IN === 'test') {
            this.genesisBlock = new Block(testnetGenesisBlock);
            this.config = { coverage: true };
            Object.assign(this.constants, testConstants);
        }

        const valid = validator.validate(this.config, configSchema.config);

        if (!valid) {
            process.exit(1);
        } else {
            this.config = this.validateForce(this.config, this.constants);
        }
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
