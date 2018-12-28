const env = process.env;
const constants = {
    PREVIOUS_DELEGATES_COUNT: 3,
    MASTER_NODE_MIGRATED_BLOCK: 0,
    CURRENT_BLOCK_VERSION: 1,
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
    },
};

if (trs.recipientId !== trs.senderId) {
    return setImmediate(cb, 'Invalid recipient');
}

if (!trs.asset || !trs.asset.votes) {
    return setImmediate(cb, 'Invalid transaction asset');
}

if (!Array.isArray(trs.asset.votes)) {
    return setImmediate(cb, 'Invalid votes. Must be an array');
}

if (!trs.asset.votes.length) {
    return setImmediate(cb, 'Invalid votes. Must not be empty');
}

if (trs.asset.votes && trs.asset.votes.length > constants.maxVotesPerTransaction) {
    return setImmediate(cb, ['Voting limit exceeded. Maximum is', constants.maxVotesPerTransaction, 'votes per transaction'].join(' '));
}


Object.assign(constants, require('../config/env'));

if (env.NODE_ENV === 'development') {
    Object.assign(constants, require('../config/default/constants'));
}

// For staging environment
if (env.NODE_ENV === 'testnet') {
    Object.assign(constants, require('../config/testnet/constants'));
}

// For production
if (env.NODE_ENV === 'mainnet') {
    Object.assign(constants, require('../config/mainnet/constants'));
}

module.exports = constants;
