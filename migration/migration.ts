import { IAsset, Transaction, TransactionModel, TransactionType } from 'shared/model/transaction';
import { TransactionDTO } from 'migration/utils/TransactionDTO';
import TransactionService from 'core/service/transaction';
import crypto from 'crypto';
import { ed, IKeyPair } from 'shared/util/ed';
import Loader from 'core/loader';
import { getAddressByPublicKey } from 'shared/util/account';
import { Block } from 'shared/model/block';
import BlockRepo from 'core/repository/block';
import AccountRepository from 'core/repository/account';
import RoundService from 'core/service/round';
import { getFirstSlotNumberInRound } from 'core/util/slot';
import DelegateRepository from 'core/repository/delegate';
import RoundRepository from 'core/repository/round';
import { getLastSlotInRound } from 'core/util/round';
import { Round, Slot, Slots } from 'shared/model/round';
import slot from 'core/service/slot';
import BlockService from 'core/service/block';
import { sortRegisterTrs } from 'migration/utils/sorter';
import db from 'shared/driver/db/index';
import { Address } from 'shared/model/account';
import { transactionSortFunc } from 'core/util/transaction';

const csv = require('csv-parser');
const fs = require('fs');

class Basket {
    createdAt: number;
    transactions: Array<TransactionModel<IAsset>>;

    constructor(data: any) {
        this.createdAt = data.createdAt;
        this.transactions = data.transactions;
    }
}

const allSecretsData: any = JSON.parse(fs.readFileSync('./secrets.json'));

// TODO need default secret
const DEFAULT_KEY_PAIR_FOR_TRANSACTION: IKeyPair = getKeyPair(
    allSecretsData.defaultSecretForTransaction
);
// TODO need default secret for second signature
const DEFAULT_KEY_PAIR_SECOND_SIGNATURE: IKeyPair = getKeyPair(
    allSecretsData.defaultSecretForSecondSignature
);
// const DEFAULT_PUBLIC_KEY_SECOND_SIGNATURE = DEFAULT_KEY_PAIR_SECOND_SIGNATURE.publicKey.toString('hex');

// TODO need secrets all delegates
const DELEGATES_SECRETS: Array<string> = allSecretsData.delegatesSecrets;

const PREPARE_TRANSACTIONS_AND_WRITE_TO_DB_AS_BASKETS = true;
const USE_TEMPORARY_DB_TABLE_WITH_BASKETS = true;
const START_CREATE_ROUNDS_AND_BLOCKS = true;
const START_SORT_TRANSACTIONS = true;
const FIX_NEGATIVE_BALANCES = true;

// 0 for all transactions
const QUANTITY_PARSE_TRS = 0;
const QUANTITY_TRS_IN_BLOCK = 250;
const COUNT_MIGRATED_REGISTER_TRS = 229594;
const OLD_DEFAULT_CREATED_AT_REGISTER_TRANSACTION = 84055860;

const QUERY_SAVE_BASKET_TO_DB = 'INSERT INTO baskets(id, basket) VALUES ($1, $2)';
const QUERY_SELECT_BASKETS = 'SELECT * FROM baskets ORDER BY id LIMIT $1::numeric OFFSET $2::numeric';
const QUERY_SELECT_BASKET_BY_ID = 'SELECT * FROM baskets WHERE id = $1:numeric';

const SENDER_PUBLIC_KEY_FOR_NEGATIVE_BALANCE_ACCOUNTS =
    'b12a7faba4784d79c7298ce49ef5131b291abd70728e6f2bd1bc2207ea4b7947';

const filePathNewTransactions = './transactionsNew_19_04_2019_T13_30.csv';
const filePathAddressesWithNegativeBalance = './10_05_2019_T12_00_addressesWithNegativeBalance.csv';

const publicKeyToKeyPairKeyMap: Map<string, IKeyPair> = new Map();

DELEGATES_SECRETS.forEach((secret: string) => {
    const keyPair: IKeyPair = getKeyPair(secret);
    publicKeyToKeyPairKeyMap.set(keyPair.publicKey.toString('hex'), keyPair);
});

const registerTransactions: Array<TransactionModel<IAsset>> = [];
let correctTransactions: Array<TransactionModel<IAsset>> = [];
let genesisAccountsSendTransactions: Array<TransactionModel<IAsset>> = [];
const basketsWithTransactionsForBlocks: Array<Basket> = [];
const senderPublicKeyFromSecondSignatureTrsSet: Set<string> = new Set();
const allBasketsIds: Array<number> = [];

let accounts: Map<Address, number> = new Map();
let countForUsedBasket = 0;
let offset = 0;

const OLD_TO_NEW_SENDER_PUBLIC_KEY: Map<string, string> = new Map([
    // "amount": 4500000000000000
    ['f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2', '86231c9dc4202ba0e27e063f431ef868b4e38669931202a83482c70091714e13'],

    // "amount": 171000000000000
    ['0ffbd8ef561024e20ca356889b5be845759356492ac8237c9bc5159b9d1b0135', 'b12a7faba4784d79c7298ce49ef5131b291abd70728e6f2bd1bc2207ea4b7947'],

    // amount: 9000000000000, new address: 2529254201347404107
    // ['', 'bb49f7f0727847a30f2780b14353d44aec0875e8a4ed77f123fc65f4f66cb3c8'],

    // amount: 2250000000000, newAddress: 13761141028469814636
    ['97c406096a6201a60086e1644cba59af1401b33ba1bbfa1ddccd62fb55374755', '873a809f9b766fc410a6dde5333c73bed36592d7ac5e354eb529591b3ed8dc29'],

    // amount: 11250000000000, newAddress: 3729625658841791180
    // ['', '207deb32d9af211f662d11e20ba88460325fb5e2e18dafc39d054ee1557e5eb0'],

    // amount: 11250000000000, newAddress: 16136522303332999295
    ['14e7911f7fe3c092ce3161a524a6daa2d897e413e684cc934b1ee782122bb934', '0485a185159ae76fbd149e3e6db8ca2ccc01476dce6c7726d7c83e989f456601'],

    // amount: 11250000000000, newAddress: 4694024168786046092
    ['123951bdc3d0608feb8ebd0defd180bfac0dc243e44ac6087749c1f32d3b3ff4', '9807d077e0c0ac95d37819f223506e64e1dbd20c3fbaf003d921c8aed9d426bf'],

    // amount: 45000000000000, newAddress: 7830105952002929850
    ['cb1cb6ee818b958385a50a02cf0fafe9c3b494f524be11894c69df23e7b271fa', 'b9c4743cd3ad541a0334904ebd278a2eaec262f71e5919ebfb8052b720111ff2'],
]);
const OLD_TO_NEW_ADDRESS: Map<string, string> = new Map([
    // "amount": 4500000000000000
    ['DDK4995063339468361088', 'DDK13566253584516829136'],

    // "amount": 171000000000000
    ['DDK8999840344646463126', 'DDK9671894634278263097'],

    // amount: 9000000000000,
    // ['DDK5143663806878841341', 'DDK2529254201347404107'],

    // amount: 2250000000000
    ['DDK7214959811294852078', 'DDK13761141028469814636'],

    // amount: 11250000000000,
    // ['DDK14224602569244644359', 'DDK3729625658841791180'],

    // amount: 11250000000000,
    ['DDK9758601670400927807', 'DDK16136522303332999295'],

    // amount: 11250000000000,
    ['DDK12671171770945235882', 'DDK4694024168786046092'],

    // amount: 45000000000000,
    ['DDK5216737955302030643', 'DDK7830105952002929850'],
]);

const SET_SENDER_PUBLIC_KEY_FROM_GENESIS: Set<string> = new Set(
    ['b12a7faba4784d79c7298ce49ef5131b291abd70728e6f2bd1bc2207ea4b7947',
        '873a809f9b766fc410a6dde5333c73bed36592d7ac5e354eb529591b3ed8dc29',
        '0485a185159ae76fbd149e3e6db8ca2ccc01476dce6c7726d7c83e989f456601',
        'b9c4743cd3ad541a0334904ebd278a2eaec262f71e5919ebfb8052b720111ff2'
    ],
);

const SET_TRS_IDS_FOR_REMOVE_TRANSACTIONS: Set<string> = new Set(
    [
        '425ddef7b6282dd6ec2f1eb5d92a21d6589c0d0475f3761b752ccd297ffa2987',
        'e863f34f77698742ca003ec25f9c33a9e09e630d651df5d863b41d1faee7ad38',
        '08a9a657842b747d797806fd7bca1c5b1d87efb227110f8bf5c64177c9e3d36f',
        'f082778d3eaabc65a5f6cefc27d5cd4cbcf1519f5821143eb3236fc5db498e8f',
        '47117efc9467078bc53612dc1978e8b09b6216447c8ce1cb43b2a7fe4ec032ec',
        'a1406ce6e9cae460816224f995650c9248b649fd218d2ecb7611039f0f1fe518',
        '17d0bfc5a43de509c842a0756a73c25719453f568155f69f4cf6d068b355a2de', // 7249643049702615870  timestamp 99030000
        'c3e94e5c69ff3c9bb04fe5a4f9af36320777e2c3e3ea82d269fc845d2cb6d7f7', // 7249643049702615870 timestamp 100182835
        '70d96395482df06df61e75fbaf9876726b9067c7e6da4a187427860893497aa0'  // 13886699056015278412 timestamp 100183472
    ]
);

(async () => {
    await Loader.start();
    await startMigration();
})().then(_ => console.log('final'));

async function startMigration() {

    console.log('PREPARE_TRANSACTIONS_AND_WRITE_TO_DB_AS_BASKETS: ', PREPARE_TRANSACTIONS_AND_WRITE_TO_DB_AS_BASKETS);
    console.log('USE_TEMPORARY_DB_TABLE_WITH_BASKETS: ', USE_TEMPORARY_DB_TABLE_WITH_BASKETS);
    console.log('START_CREATE_ROUNDS_AND_BLOCKS: ', START_CREATE_ROUNDS_AND_BLOCKS);
    console.log('START_SORT_TRANSACTIONS: ', START_SORT_TRANSACTIONS);
    console.log('FIX_NEGATIVE_BALANCES: ', FIX_NEGATIVE_BALANCES);

    const startTime = new Date();
    console.log('START TIME ', getFormattedDate());

    if (PREPARE_TRANSACTIONS_AND_WRITE_TO_DB_AS_BASKETS) {
        await startPrepareTransactionsForMigration();
    }

    if (START_CREATE_ROUNDS_AND_BLOCKS) {
        await startCreateRoundsAndBlocks();
    }

    console.log('USED BASKETS IDs: ', allBasketsIds);

    const endTime = new Date();
    console.log('START TIME ', startTime);
    console.log('END TIME ', endTime);

}

let allRegisterTrsCount = 0;

async function startPrepareTransactionsForMigration() {
    console.log('START prepare transaction!!!');

    const setForRegisterTrsSenderPublicKey: Set<string> = new Set();

    let [newTrs] = [
        await readTransactionsToArray(filePathNewTransactions),
    ];

    newTrs.forEach(((trs: any) => {
        if (OLD_TO_NEW_SENDER_PUBLIC_KEY.has(trs.senderPublicKey)) {
            // const tempTrsSenderPublicKey = trs.senderPublicKey;
            trs.senderPublicKey = OLD_TO_NEW_SENDER_PUBLIC_KEY.get(trs.senderPublicKey);
            // console.log(`CHANGED trs.senderPublicKey
            // from ${tempTrsSenderPublicKey} to ${trs.senderPublicKey}`);
        }

        if (trs.type === TransactionType.SEND && OLD_TO_NEW_ADDRESS.has(trs.recipientAddress)) {
            // const tempTrsRecipientAddress = trs.recipientAddress;
            trs.recipientAddress = OLD_TO_NEW_ADDRESS.get(trs.recipientAddress);
            // console.log(`CHANGED trs.recipientAddress
            // from ${tempTrsRecipientAddress} to ${trs.recipientAddress}`);
        }

        if (Number(trs.type) === TransactionType.REGISTER) {
            trs.referrals = trs.referrals.substr(1)
            .slice(0, -1)
            .replace(/DDK/ig, '')
            .split(',');
            trs.senderAddress = getAddressByPublicKey(trs.senderPublicKey);
        }
    }));

    if (START_SORT_TRANSACTIONS) {
        const sortedRegisterTrs = sortRegisterTrs(newTrs.slice(0, COUNT_MIGRATED_REGISTER_TRS) as any);
        newTrs = [...sortedRegisterTrs, ...newTrs.slice(COUNT_MIGRATED_REGISTER_TRS)];
        sortedRegisterTrs.length = 0;
        runGarbageCollection();
    }

    let count = 0;
    console.log(newTrs.length);
    newTrs.forEach(
        function <T extends IAsset>(transaction) {
            if (!SET_TRS_IDS_FOR_REMOVE_TRANSACTIONS.has(transaction.id)) {
                let correctTransaction: TransactionDTO = null;
                // let airdropReward = transaction.airdropReward ? JSON.parse(transaction.airdropReward) : {};
                switch (Number(transaction.type)) {
                    case TransactionType.REGISTER:
                        correctTransaction = new TransactionDTO({
                            ...transaction,
                            asset: {
                                referral: transaction.referrals[0]
                            }
                        });
                        ++allRegisterTrsCount;
                        break;
                    case TransactionType.SEND:
                        correctTransaction = new TransactionDTO({
                            ...transaction,
                            asset: {
                                recipientAddress: transaction.recipientAddress.replace(/DDK/ig, ''),
                                amount: Number(transaction.amount)
                            }
                        });
                        break;
                    case TransactionType.SIGNATURE:
                        correctTransaction = new TransactionDTO({
                            ...transaction,
                            asset: {
                                publicKey: transaction.secondPublicKey
                            }
                        });
                        break;
                    case TransactionType.DELEGATE:
                        correctTransaction = new TransactionDTO({
                            ...transaction,
                            asset: {
                                username: transaction.username
                            }
                        });
                        break;
                    case TransactionType.STAKE:
                        correctTransaction = new TransactionDTO({
                            ...transaction,
                            asset: {
                                amount: Number(transaction.stakedAmount),
                                startTime: Number(transaction.startTime),
                                startVoteCount: getCorrectStartVoteCount(Number(transaction.voteCount)),
                            }
                        });
                        if (transaction.airdropReward) {
                            Object.assign(correctTransaction,
                                {
                                    airdropReward: {
                                        sponsors: JSON.stringify(transaction.airdropReward.sponsors)
                                        .replace(/DDK/ig, '')
                                    }
                                });
                        }
                        break;
                    case TransactionType.VOTE:
                        const votes: Array<string> = transaction.votes.split(',') || [];
                        correctTransaction = new TransactionDTO({
                            ...transaction,
                            asset: {
                                votes: votes.map(oldVote => oldVote.slice(1)),
                                type: votes[0][0]
                            },
                        });

                        // if (Number(transaction.reward) > 0) {
                        //     Object.assign(correctTransaction.asset,
                        //         {
                        //             reward: Number(transaction.reward),
                        //             airdropReward: JSON.stringify(airdropReward.sponsors).replace(/DDK/ig, ''),
                        //         });
                        // }
                        break;
                    default:

                }

                ++count;
                if (Number.isInteger(count / 1000)) {
                    console.log('COUNT: ', count);
                }

                if (correctTransaction.type === TransactionType.SEND &&
                    SET_SENDER_PUBLIC_KEY_FROM_GENESIS.has(correctTransaction.senderPublicKey)) {
                    genesisAccountsSendTransactions.push(correctTransaction);
                } else if (correctTransaction.type === TransactionType.REGISTER) {
                    if (!setForRegisterTrsSenderPublicKey.has(correctTransaction.senderPublicKey)) {
                        registerTransactions.push(correctTransaction);
                        setForRegisterTrsSenderPublicKey.add(correctTransaction.senderPublicKey);
                    }
                } else {
                    correctTransactions.push(new TransactionModel(correctTransaction));
                }
            }
        });

    console.log('senderPublicKeyFromSecondSignatureTrsSet: ', senderPublicKeyFromSecondSignatureTrsSet);


    // await changeSendAndStakeTrsOrder();

    changeCreatedAtForRegisterTransactionsWithDefaultCreatedAt();

    if (FIX_NEGATIVE_BALANCES) {
        await addMoneyForNegativeBalanceAccounts();
    }


    correctTransactions = concatRegisterAndSendAndAllOthersTrs();
    console.log('newTrs length: ', newTrs.length);
    console.log('correctTransactions length: ', correctTransactions.length);

    newTrs.length = 0;

    runGarbageCollection();
    console.log('Cleared newTrs!');

    runGarbageCollection();

    console.log('Prepared transactions: ', correctTransactions.length);

    await createArrayBasketsTrsForBlocks();
    await basketsWithTransactionsForBlocks.reverse();

    if (USE_TEMPORARY_DB_TABLE_WITH_BASKETS) {
        await saveBasketsToDB();
    }

    console.log('FINISH prepare transaction!!!');
}

async function startCreateRoundsAndBlocks() {
    await createFirstRoundAndBlocksForThisRound();
    await createNextRoundsAndBlocks();
}

function concatRegisterAndSendAndAllOthersTrs() {
    console.log('SET SEND trs to after register index: ', allRegisterTrsCount);
    console.log('genesisAccountsSendTransactions.length: ', genesisAccountsSendTransactions.length);
    console.log('correctTransactions.length: ', correctTransactions.length);
    const allTrs = registerTransactions.concat(genesisAccountsSendTransactions).concat(correctTransactions);
    console.log('FINISH SET SEND trs to after register! allTrs.length', allTrs.length);
    return allTrs;
}

async function saveBasketsToDB() {
    console.log('START SAVE BASKETS TO DB');
    for (let i = 0; i < basketsWithTransactionsForBlocks.length; i++) {
        const basket: Basket = basketsWithTransactionsForBlocks[i];
        try {
            console.log('Try to save basket: ', i);
            await db.none(QUERY_SAVE_BASKET_TO_DB, [i, basket]);
        } catch (err) {
            console.log('ERROR: ', err);
            console.log('NOT SAVED BASKET: ', JSON.stringify(basket));
        }
    }
    console.log('FINISH SAVE BASKETS TO DB');
    basketsWithTransactionsForBlocks.length = 0;
    console.log('CLEARED basketsWithTransactionsForBlocks!');
    runGarbageCollection();
}

async function getBatchBasketsByLimit(limit: number) {
    if (USE_TEMPORARY_DB_TABLE_WITH_BASKETS) {
        return getBatchBasketsFromDbByLimit(limit);
    } else {
        console.log('basketsWithTransactionsForBlocks', basketsWithTransactionsForBlocks.length);
        console.log('OFFSET: ', offset);
        console.log('LIMIT: ', limit);
        console.log('basketsWithTransactionsForBlocks.slice(offset, limit): ', basketsWithTransactionsForBlocks.slice(offset, limit));
        const batchBaskets: Array<Basket> = basketsWithTransactionsForBlocks.slice(offset, offset + limit);
        offset += batchBaskets.length;
        console.log('batchBaskets.length: ', batchBaskets.length);
        return batchBaskets;
    }

}

async function getBatchBasketsFromDbByLimit(limit: number) {
    try {
        const baskets: Array<Basket> = [];
        const basketIds: Array<number> = [];
        const rowBaskets: Array<any> = await db.manyOrNone(QUERY_SELECT_BASKETS, [limit, offset]);
        rowBaskets.forEach((dbBasket) => {
            baskets.push(dbBasket.basket);
            basketIds.push(dbBasket.id);
        });
        console.log('OFFSET: ', offset);
        console.log('LIMIT: ', limit);
        console.log('BASKETS_IDS: ', basketIds);
        offset += baskets.length;
        allBasketsIds.concat(basketIds);
        console.log('allBasketsIds: ', allBasketsIds);
        return baskets;
    } catch (err) {
        console.log('Problem with [getBasketsFromDB]');
        console.log('ERROR: ', err);
    }
}

async function getBasketById(id: number) {
    try {
        const basket: Basket = await db.oneOrNone(QUERY_SELECT_BASKET_BY_ID, [id]);
        return basket;
    } catch (err) {
        console.log('Problem with [getBasketById]');
        console.log('ERROR: ', err);
    }
}

async function createFirstRoundAndBlocksForThisRound() {
    console.log('START create first round!');
    const limit = DelegateRepository.getActiveDelegates().length;

    const batchBaskets: Array<Basket> = await getBatchBasketsByLimit(limit);
    const firstRound: Round = RoundService.generate(
        getFirstSlotNumberInRound(
            batchBaskets[0].createdAt,
            DelegateRepository.getActiveDelegates().length
        )
    );

    RoundRepository.add(firstRound);
    let startedCreateFilledBlock = false;

    console.log('FirstRound: ', RoundRepository.getCurrentRound());
    for (const slot of Object.entries(firstRound.slots)) {
        console.log('slot[1].slot: ', slot[1].slot);
        console.log('basketsWithTransactionsForBlocks[0].createdAt: ',
            Math.floor(batchBaskets[0].createdAt));

        if (slot[1].slot === Math.floor(batchBaskets[0].createdAt) / 10) {
            startedCreateFilledBlock = true;
        }
        console.log('startedCreateFilledBlock: ', startedCreateFilledBlock);
        console.log('slot[0]: ', slot[0]);
        const keyPair: IKeyPair = publicKeyToKeyPairKeyMap.get(slot[0]);
        const timestamp = slot[1].slot * 10;
        const previousBlock = await BlockRepo.getLastBlock();
        let transactions: Array<TransactionModel<IAsset>> = [];
        if (startedCreateFilledBlock) {
            transactions = batchBaskets[countForUsedBasket].transactions.map(
                trs => TransactionService.create(
                    trs,
                    DEFAULT_KEY_PAIR_FOR_TRANSACTION,
                    trs.secondSignature && DEFAULT_KEY_PAIR_SECOND_SIGNATURE
                ).data
            );
            ++countForUsedBasket;
        }

        console.log('slot ', JSON.stringify(slot));
        console.log('publicKey ', keyPair.publicKey.toString('hex'));
        console.log('privateKey ', keyPair.privateKey.toString('hex'));
        console.log('timestamp ', timestamp);
        console.log('previousBlockId ', previousBlock.id);
        console.log('transactions.length ', transactions.length);

        const block: Block = await BlockService.create({
            keyPair,
            timestamp,
            previousBlock,
            transactions
        });
        await BlockService.process(block, false, {
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey,
        }, false);

        // if (startedCreateFilledBlock) {
        // basketsWithTransactionsForBlocks[countForUsedBasket].transactions.length = 0;
        // ++countForUsedBasket;
        // }

    }
    if (startedCreateFilledBlock) {
        offset = countForUsedBasket;
    }
    console.log('countForUsedBasket: ', countForUsedBasket);
    console.log('FINISH create first round!');
}

async function createNextRoundsAndBlocks() {
    console.log('START create next round!');
    let newBlockTimestamp = Math.floor(BlockRepo.getLastBlock().createdAt);
    const activeDelegates = DelegateRepository.getActiveDelegates();
    const limit = activeDelegates.length;
    let batchBaskets: Array<Basket> = await getBatchBasketsByLimit(limit);
    let countForCreateNewRound = 0;
    // const setForSecond;
    while (batchBaskets.length > 0) {
        for (const basket of <Array<Basket>>batchBaskets) {
            if (countForCreateNewRound === 0) {
                forwardProcess();
                countForCreateNewRound = activeDelegates.length;
            }
            const slotsFromCurrentRound: Slots = await RoundRepository.getCurrentRound().slots;
            const previousBlock = await BlockRepo.getLastBlock();
            console.log('previousBlockId: ', previousBlock.id);
            newBlockTimestamp += 10;
            console.log('basket.transactions.length ', basket.transactions.length);
            console.log('slotsFromCurrentRound ', slotsFromCurrentRound);
            console.log('newBlockTimestamp ', newBlockTimestamp);
            const keyPair: IKeyPair = publicKeyToKeyPairKeyMap.get(Object.entries(slotsFromCurrentRound).find(([key, slot]: [string, Slot]) =>
                slot.slot === newBlockTimestamp / 10
            )[0]);

            const transactions = basket.transactions.map(trs => {
                trs.senderAddress = getAddressByPublicKey(trs.senderPublicKey);
                const sender = AccountRepository.getByAddress(trs.senderAddress);
                const transaction = TransactionService.create(
                    trs,
                    DEFAULT_KEY_PAIR_FOR_TRANSACTION,
                    sender && sender.secondPublicKey && DEFAULT_KEY_PAIR_SECOND_SIGNATURE
                ).data;
                TransactionService.applyUnconfirmed(
                    transaction,
                    sender || AccountRepository.getByAddress(trs.senderAddress)
                );
                return transaction;
            });

            const reversedTransaction = [...transactions];
            reversedTransaction.reverse();
            reversedTransaction.forEach(trs => {
                TransactionService.undoUnconfirmed(trs, AccountRepository.getByAddress(trs.senderAddress));
            });

            const block: Block = await BlockService.create({
                keyPair,
                timestamp: newBlockTimestamp,
                previousBlock,
                transactions,
            });
            await BlockService.process(block, false, {
                privateKey: keyPair.privateKey,
                publicKey: keyPair.publicKey,
            }, false);

            basket.transactions.length = 0;
            --countForCreateNewRound;
        }
        batchBaskets = await getBatchBasketsByLimit(limit);
    }
    console.log('FINISH create round: ', roundCounter);
}

let roundCounter = 1;

function forwardProcess(): void {
    const currentRound = RoundRepository.getCurrentRound();
    RoundService.processReward(currentRound);

    const newRound = RoundService.generate(getLastSlotInRound(currentRound) + 1);
    RoundRepository.add(newRound);
    console.log(`New round created: ${JSON.stringify(newRound)}, count: ${++roundCounter}`);
}

function createArrayBasketsTrsForBlocks() {
    console.log('START create baskets');
    let transactions: Array<TransactionModel<IAsset>> = [];
    let count = 0;
    let maxTransactionsCreatedAtInBasket = 0;
    do {
        transactions = popTransactionsForMigration(QUANTITY_TRS_IN_BLOCK);
        if (transactions.length) {
            if (maxTransactionsCreatedAtInBasket) {
                maxTransactionsCreatedAtInBasket -= 10;
            } else {
                maxTransactionsCreatedAtInBasket = Math.ceil(Math.max(...transactions.map(trs => trs.createdAt)) / 10) * 10;
            }

            if (maxTransactionsCreatedAtInBasket > 0) {
                basketsWithTransactionsForBlocks.push(
                    new Basket({ createdAt: maxTransactionsCreatedAtInBasket, transactions: transactions })
                );
                ++count;
            }
        }
    } while (transactions.length > 0);

    console.log(`FINISH create basket! Created: ${count} baskets!`);
}

function changeSendAndStakeTrsOrder() {
    console.log('START CHANGE SEND AND STAKE ORDER');
    const setAddress: Set<Address> = new Set();
    const mapAddressIndex: Map<Address, number> = new Map();

    for (let i = 0; i < correctTransactions.length; i++) {
        const address: Address = getAddressByPublicKey(correctTransactions[i].senderPublicKey);
        if (!setAddress.has(address) && correctTransactions[i].type !== TransactionType.REGISTER) {
            setAddress.add(address);
            if (correctTransactions[i].type === TransactionType.STAKE) {
                mapAddressIndex.set(address, i);
            }
        }

        if (correctTransactions[i].type === TransactionType.SEND && mapAddressIndex.has(address)) {
            let index = mapAddressIndex.get(address);
            let intermediateTrs = correctTransactions[index];
            let intermediateCreatedAt = intermediateTrs.createdAt;
            correctTransactions[index] = correctTransactions[i];
            intermediateTrs.createdAt = correctTransactions[index].createdAt;
            correctTransactions[index].createdAt = intermediateCreatedAt;
            correctTransactions[i] = intermediateTrs;

            mapAddressIndex.delete(address);
        }
    }
    setAddress.clear();
    mapAddressIndex.clear();
    console.log('FINISH CHANGE SEND AND STAKE ORDER');
}

async function addMoneyForNegativeBalanceAccounts() {
    console.log('START FIX NEGATIVE BALANCES', accounts.size);
    accounts = await readAccountsToMap(filePathAddressesWithNegativeBalance);
    // let lastRegisterIndexCount = 0;
    // let createdAtRegisterTrs = 0;
    // for (let i = 0; i < correctTransactions.length; i++) {
    //     const transaction = correctTransactions[i];
    //     if (transaction.type === TransactionType.REGISTER && createdAtRegisterTrs === 0) {
    //         lastRegisterIndexCount = i;
    //         createdAtRegisterTrs = transaction.createdAt;
    //     } else if (transaction.type === TransactionType.REGISTER && transaction.createdAt === createdAtRegisterTrs) {
    //         ++lastRegisterIndexCount;
    //     } else if (i - lastRegisterIndexCount > 1000) {
    //         break;
    //     }
    // }

    let createdAt = genesisAccountsSendTransactions[genesisAccountsSendTransactions.length - 1].createdAt;
    const additionalSendTransactions: Array<TransactionModel<IAsset>> = [];
    // const keyPair: IKeyPair = DEFAULT_KEY_PAIR_FOR_TRANSACTION;
    accounts.forEach((value, key) => {
        const additionalSendTransaction = new TransactionDTO({
            type: TransactionType.SEND,
            senderPublicKey: SENDER_PUBLIC_KEY_FOR_NEGATIVE_BALANCE_ACCOUNTS,
            createdAt: ++createdAt,
            asset: {
                recipientAddress: key.toString(),
                amount: Math.abs(value)
            }
        });
        additionalSendTransactions.push(new TransactionModel(additionalSendTransaction));
    });
    genesisAccountsSendTransactions = genesisAccountsSendTransactions.concat(additionalSendTransactions);
    accounts.clear();
    console.log('FINISH FIX NEGATIVE BALANCES', genesisAccountsSendTransactions.length, additionalSendTransactions.length);
}

function popTransactionsForMigration(quantity: number) {
    let transactions = [];
    if (correctTransactions.length > quantity) {
        transactions = correctTransactions.splice(correctTransactions.length - quantity, quantity).sort(transactionSortFunc);
    } else {
        transactions = correctTransactions.splice(0, correctTransactions.length).sort(transactionSortFunc);
    }

    transactions.forEach((trs, index) => {
        trs.createdAt += index;
    });

    return transactions.sort(transactionSortFunc);
}

function readTransactionsToArray(filePath): Promise<Array<Object>> {
    console.log('START parse csv with new transactions!');
    let count = 0;
    return new Promise((resolve, reject) => {

        const transactions: Array<Object> = [];

        fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            if (QUANTITY_PARSE_TRS > 0 && count >= QUANTITY_PARSE_TRS) {
                return;
            }
            transactions.push(data);
            ++count;
        })
        .on('end', () => {
            console.log('Parsed transactions new: ', count);
            console.log('FINISH parse csv with new transactions!');
            resolve(transactions);
        });
    });

}

function readTransactionsToMap(filePath): Promise<Map<string, object>> {

    console.log('START parse csv with old transactions!');
    let count = 0;

    return new Promise((resolve, reject) => {
        const transactions = new Map();

        fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            if (QUANTITY_PARSE_TRS > 0 && count >= QUANTITY_PARSE_TRS) {
                return;
            }
            transactions.set(data.id, data);
            ++count;
        })
        .on('end', () => {
            console.log('Parsed transactions old: ', count);
            console.log('FINISH parse csv with old transactions!');
            resolve(transactions);
        });
    });
}

function readAccountsToMap(filePath): Promise<Map<Address, number>> {
    console.log('START parse csv with negative balances accounts!');
    let totalNegativeBalance = 0;
    let counter = 0;
    return new Promise((resolve, reject) => {
        const accounts: Map<Address, number> = new Map();

        fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            if (accounts.has(BigInt(data[Object.keys(data)[0]]))) {
                accounts.set(BigInt(data[Object.keys(data)[0]]),
                    accounts.get(BigInt(data[Object.keys(data)[0]])) + Number(data.amount));
                totalNegativeBalance += data.amount;
                console.log('EXIST: ', accounts.get(BigInt(data[Object.keys(data)[0]])));
            } else {
                // accounts.set(Number(data.address.replace(/DDK/ig, '')), Number(data.amount));
                accounts.set(BigInt(data[Object.keys(data)[0]]), Number(data.amount));
                totalNegativeBalance += data.amount;
                ++counter;
            }
        })
        .on('end', () => {
            console.log('Parsed accounts with negative balance: ', accounts.size);
            // console.log('accounts', accounts);
            resolve(accounts);
        });
    });
}

function changeCreatedAtForRegisterTransactionsWithDefaultCreatedAt() {
    for (let i = 0; i < registerTransactions.length; i++) {
        if (registerTransactions[i].createdAt === OLD_DEFAULT_CREATED_AT_REGISTER_TRANSACTION) {
            registerTransactions[i].createdAt += i;
        }
    }
}

function getKeyPair(secret: string): IKeyPair {
    const hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
    return ed.makeKeyPair(hash);
}

function getFormattedDate() {
    let date = new Date();
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
        date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

}

function getCorrectStartVoteCount(voteCount: number): number {
    if (voteCount === 24) {
        return 20;
    } else if (voteCount < 24) {
        return Math.floor(voteCount / 4) * 4;
    } else {
        return 0;
    }
}

export function runGarbageCollection() {
    console.log('global.gc working....');
    try {
        if (global.gc) {
            global.gc();
        }
    } catch (e) {
        console.log('`node --expose-gc index.js`');
        // process.exit();
    }
    console.log('global.gc finish');
}

