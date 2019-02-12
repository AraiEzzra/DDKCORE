/**
 * @namespace constants
 * @memberof module:helpers
 * @property {number} activeDelegates - The default number of delegates.
 * @property {number} maxVotesPerTransaction - The maximum number of votes in vote type transaction.
 * @property {number} addressLength - The default address length.
 * @property {number} blockHeaderLength - The default block header length.
 * @property {number} blockReceiptTimeOut
 * @property {number} confirmationLength
 * @property {Date} epochTime
 * @property {object} fees - The default values for fees.
 * @property {number} fees.send
 * @property {number} fees.vote
 * @property {number} fees.secondsignature
 * @property {number} fees.delegate
 * @property {number} fees.multisignature
 * @property {number} fees.dapp
 * @property {number} feeStart
 * @property {number} feeStartVolume
 * @property {number} fixedPoint
 * @property {number} maxAddressesLength
 * @property {number} maxAmount
 * @property {number} maxConfirmations
 * @property {number} maxPayloadLength
 * @property {number} maxPeers
 * @property {number} maxRequests
 * @property {number} maxSharedTxs
 * @property {number} maxSignaturesLength
 * @property {number} maxTxsPerBlock
 * @property {number} minBroadhashConsensus
 * @property {string[]} nethashes - Mainnet and Testnet.
 * @property {number} numberLength
 * @property {number} requestLength
 * @property {object} rewards
 * @property {number[]} rewards.milestones - Initial 5, and decreasing until 1.
 * @property {number} rewards.offset - Start rewards at block (n).
 * @property {number} rewards.distance - Distance between each milestone
 * @property {number} signatureLength
 * @property {number} totalAmount
 * @property {number} unconfirmedTransactionTimeOut - 1080 blocks
 */
export default {
    airdrop: {
        account: 'DDK10720340277000928808',
        stakeRewardPercent: 10,
        referralPercentPerLevel: [5, 3, 2, 2, 1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.5, 0.5]
    },
    blockSlotWindow: 5,
    activeDelegates: 3,
    maxVotes: 11,
    maxVotesPerTransaction: 3,
    maxTransferCount: 3,
    addressLength: 208,
    blockHeaderLength: 248,
    blockReceiptTimeOut: 20, // 2 blocks
    confirmationLength: 77,
    epochTime: new Date(Date.UTC(2016, 0, 1, 17, 0, 0, 0)),
    fees: {
        send: 0.01,
        vote: 0.01,
        secondsignature: 1000000,
        delegate: 1000000000,
        multisignature: 1000000,
        dapp: 2500000000,
        froze: 0.01,
        sendfreeze: 0.1,
        reward: 0
    },
    feeStart: 1,
    feeStartVolume: 10000 * 100000000,
    fixedPoint: 10 ** 8,
    maxAddressesLength: 208 * 128,
    maxAmount: 100000000,
    maxConfirmations: 77 * 100,
    maxPayloadLength: 1024 * 1024,
    maxPeers: 100,
    maxRequests: 10000 * 12,
    maxSharedTxs: 100,
    maxSignaturesLength: 196 * 256,
    maxTxsPerBlock: 25,
    nethashes: [
        '82c2a4fddcd1f659ba60380ebdd38125c5c48ceeef7d8b9f5798c0faca89e808'
    ],
    nethash: '82c2a4fddcd1f659ba60380ebdd38125c5c48ceeef7d8b9f5798c0faca89e808',
    numberLength: 100000000,
    requestLength: 104,
    // WARNING: When changing rewards you also need to change getBlockRewards(int) SQL function!
    rewards: {
        milestones: [
            500000000, // Initial Reward
            400000000, // Milestone 1
            300000000, // Milestone 2
            200000000, // Milestone 3
            100000000  // Milestone 4
        ],
        offset: 2160,      // 2160 Start rewards at block (n)
        distance: 3000000, // Distance between each milestone
    },
    signatureLength: 196,
    // WARNING: When changing totalAmount you also need to change getBlockRewards(int) SQL function!
    totalAmount: 4500000000000000,
    unconfirmedTransactionTimeOut: 10800, // 1080 blocks
    multisigConstraints: {
        min: {
            minimum: 1,
            maximum: 15
        },
        lifetime: {
            minimum: 1,
            maximum: 72
        },
        keysgroup: {
            minItems: 1,
            maxItems: 15
        }
    },
    // Configurable froze order : time here is in minutes
    froze: {
        endTime: 48,
        rTime: 8,
        vTime: 0.1,
        milestone: 8, // for testing, taking 2 min
        rewards: {
            milestones: [
                10, // 10% For 0-6 months
                10, // 10% For 7-12 months
                10, // 8% For 13-18 months
                10, // 6% For 19-24 months
                10, // 4% For 25-30 months
                10  // 2% For 31 months and above
            ],
            distance: 30, // Distance between each milestone is 6 months
        },
        rewardVoteCount: 2,
        unstakeVoteCount: 4
    },
    defaultLock: 0,
    TemplateId: {
        referralMail: 8257936,
        welcomeMail: 8265220
    }
};
