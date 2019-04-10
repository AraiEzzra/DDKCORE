import { IAsset, Transaction, TransactionModel, TransactionType } from 'shared/model/transaction';
import { TransactionDTO } from 'migration/utils/TransactionDTO';
import TransactionService from 'core/service/transaction';
import crypto from 'crypto';
import { ed, IKeyPair } from 'shared/util/ed';
import Loader from 'core/loader';
import { getAddressByPublicKey } from 'shared/util/account';
import { Block } from 'shared/model/block';
import BlockRepo from 'core/repository/block';
import SlotService from 'core/service/slot';
import RoundService from 'core/service/round';
import { getFirstSlotNumberInRound } from 'core/util/slot';
import DelegateRepository from 'core/repository/delegate';
import RoundRepository from 'core/repository/round';
import { getLastSlotInRound } from 'core/util/round';
import { Round, Slot, Slots } from 'shared/model/round';
import slot from 'core/service/slot';
import BlockService from 'core/service/block';

const csv = require('csv-parser');
const fs = require('fs');

// 0 for all transactions
const QUANTITY_PARSE_TRS = 300000;
const QUANTITY_TRS_IN_BLOCK = 250;

const filePathNewTransactions = './transactionsNew.csv';
const filePathOldTransactions = './transactionsOld.csv';
const filePathAddressesWithNegativeBalance = './addressesWithNegativeBalance.csv';


const publicSecretKeyMap: Map<string, string> = new Map();

delegatesSecrets.forEach((secret: string) => {
   publicSecretKeyMap.set(getKeyPair(secret).publicKey.toString('hex'), secret)
});

const correctTransactions: Array<Transaction<IAsset>> = [];
const basketsWithTransactionsForBlocks: Array<Basket> = [];
let countForUsedBasket = 0;

Loader.start();
startPrepareTransactionsForMigration();

export async function startPrepareTransactionsForMigration() {

    console.log('START prepare transaction!!!');
    console.log('TIME ', getFormattedDate());

    const [newTrs, oldTrs] = [
        await readTransactionsToArray(filePathNewTransactions),
        await readTransactionsToMap(filePathOldTransactions),
    ];
    let count = 0;
    console.log(newTrs.length, oldTrs.size);
    newTrs.forEach(
        function <T extends IAsset>(transaction) {
            let correctTransaction: TransactionDTO = null;
            let airdropReward = transaction.airdropReward ? JSON.parse(transaction.airdropReward) : {};
            switch (Number(transaction.type)) {
                case TransactionType.REGISTER:
                    correctTransaction = new TransactionDTO({
                        ...transaction,
                        asset: {
                            referral: transaction.referrals.substr(1)
                            .slice(0, -1)
                            .replace(/DDK/ig, '')
                            .split(',')[0]
                        }
                    });
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
                    const oldTransaction: any = oldTrs.get(transaction.id);
                    correctTransaction = new TransactionDTO({
                        ...transaction,
                        asset: {
                            amount: Number(transaction.amount),
                            startTime: Number(transaction.startTime),
                            startVoteCount: oldTransaction ? Number(oldTransaction.voteCount) : 0,
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
                // case TransactionType.SENDSTAKE:
                //     correctTransaction = new TransactionDTO({
                //         ...transaction,
                //         asset: {
                //             recipientAddress: transaction.recipientAddress.replace(/DDK/ig, '')
                //         }
                //     });
                //     break;
                case TransactionType.VOTE:

                    const votes: Array<string> = transaction.votes.split(',') || [];
                    correctTransaction = new TransactionDTO({
                        ...transaction,
                        asset: {
                            votes: votes,
                            unstake: Number(transaction.unstake),
                        },
                    });
                    if (Number(transaction.reward) > 0) {
                        Object.assign(correctTransaction,
                            {
                                reward: Number(transaction.reward),
                                airdropReward: JSON.stringify(airdropReward.sponsors).replace(/DDK/ig, ''),
                            });
                    }
                    break;
                default:
                    correctTransaction = new TransactionDTO({ ...transaction, asset: {} });

            }

            ++count;
            if (Number.isInteger(count / 1000)) {
                console.log('COUNT: ', count);
            }
            correctTransactions.push(TransactionService.create(new TransactionModel(correctTransaction),
                getKeyPair(correctTransaction.senderPublicKey)).data);
        });

    await changeSendAndStakeTrsOrder();
    // TODO uncommented
    await addMoneyForNegativeBalanceAccounts();

    newTrs.length = 0;
    oldTrs.clear();

    console.log('newTrs length: ', newTrs.length);
    console.log('oldTrs size: ', oldTrs.size);
    console.log('Prepared transactions: ', correctTransactions.length);

    await createArrayBasketsTrsForBlocks();
    basketsWithTransactionsForBlocks.reverse();


    await createFirstRoundAndBlocksForThisRound();

    // forwardProcess();

    await createNextRoundsAndBlocks()

    console.log('END TIME ', getFormattedDate());

}

async function createNextRoundsAndBlocks() {
    console.log('START create next round!');
    let newBlockTimestamp = Math.floor(BlockRepo.getLastBlock().createdAt);
    const activeDelegates = DelegateRepository.getActiveDelegates();
    let countForCreateNewRound = 0;
    for ( const basket of <Array<Basket>>basketsWithTransactionsForBlocks.slice(countForUsedBasket)) {
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
        console.log('Object.entries(slotsFromCurrentRound) ', Object.entries(slotsFromCurrentRound));
        console.log('newBlockTimestamp ', newBlockTimestamp);
        const secret = publicSecretKeyMap.get(Object.entries(slotsFromCurrentRound).find(([key, slot]: [string, Slot]) =>
            slot.slot === newBlockTimestamp / 10
        )[0]);
            // getKeyByValue(, ));
        const keyPair: IKeyPair = getKeyPair(secret);
        const block: Block = await BlockService.create({
            keyPair,
            timestamp: newBlockTimestamp,
            previousBlock,
            transactions: basket.transactions,
        });
        await BlockService.process(block, false, {
            privateKey: keyPair.privateKey.toString('hex'),
            publicKey: keyPair.publicKey.toString('hex'),
        }, false);
        --countForCreateNewRound;
    };
    console.log('FINISH create round!');
}

function getKeyByValue(object, value): string {
    return Object.keys(object).find(key => object[key] === value);
}

async function createFirstRoundAndBlocksForThisRound() {
    console.log('START create first round! ', basketsWithTransactionsForBlocks.length);
    const firstRound: Round = RoundService.generate(
        getFirstSlotNumberInRound(Math.floor(basketsWithTransactionsForBlocks[0].createdAt),
            DelegateRepository.getActiveDelegates().length)
    );
    RoundRepository.add(firstRound);

    console.log('First round: ', RoundRepository.getCurrentRound())
    for ( const slot of Object.entries(firstRound.slots)) {
        console.log('slot[1].slot: ', slot[1].slot);
        console.log('basketsWithTransactionsForBlocks[0].createdAt: ',
            Math.floor(basketsWithTransactionsForBlocks[0].createdAt) / 10);
        let startedCreateFilledBlock = false;
        if (slot[1].slot === Math.floor(basketsWithTransactionsForBlocks[0].createdAt) / 10) {
            startedCreateFilledBlock = true;
        }
        console.log('startedCreateFilledBlock: ', startedCreateFilledBlock);
        console.log('slot[0]: ', slot[0]);
        const keyPair: IKeyPair = getKeyPair(publicSecretKeyMap.get(slot[0]));
        const timestamp = slot[1].slot * 10;
        const previousBlock = await BlockRepo.getLastBlock();
        const transactions = basketsWithTransactionsForBlocks[countForUsedBasket].transactions;
            // startedCreateFilledBlock ? basketsWithTransactionsForBlocks[countForUsedBasket].transactions : [];

        console.log('slot ',JSON.stringify(slot));
        console.log('publicKey ',keyPair.publicKey.toString('hex'));
        console.log('privateKey ',keyPair.privateKey.toString('hex'));
        console.log('timestamp ',timestamp);
        console.log('previousBlockId ',previousBlock.id);
        console.log('transactions.length ',transactions.length);

        const block: Block = await BlockService.create({
            keyPair,
            timestamp,
            previousBlock,
            transactions
        });
        // console.log(`Created block for first round: ${JSON.stringify(block)}`);
        await BlockService.process(block, false, {
            privateKey: keyPair.privateKey.toString('hex'),
            publicKey: keyPair.publicKey.toString('hex'),
        }, false);

        // if (startedCreateFilledBlock) {
        //     basketsWithTransactionsForBlocks[countForUsedBasket].transactions = [];
            ++countForUsedBasket;
        // }

    };
    console.log('FINISH create first round!');
}

let roundCounter = 1;
function forwardProcess(): void {
    const currentRound = RoundRepository.getCurrentRound();
    RoundService.processReward(currentRound);

    const newRound = RoundService.generate(getLastSlotInRound(currentRound) + 1);
    RoundRepository.add(newRound);
    console.log(`New round created: ${JSON.stringify(newRound)}, count: ${++roundCounter}`);
}

class Basket {
    createdAt: number;
    transactions: Array<TransactionModel<IAsset>>;

    constructor(data: any) {
        this.createdAt = data.createdAt;
        this.transactions = data.transactions;
    }
}

function createArrayBasketsTrsForBlocks() {
    console.log('START create baskets');
    let transactions: Array<Transaction<IAsset>> = [];
    let count = 0;
    // let previousBlock: Block = null;
    // let timestamp = 0;
    do {
        let maxTransactionsCreatedAtInBasket: number = 0;
        transactions = popTransactionsForMigration(QUANTITY_TRS_IN_BLOCK);
        transactions.forEach((transaction: TransactionModel<IAsset>) => {
            maxTransactionsCreatedAtInBasket =
                transaction.createdAt > maxTransactionsCreatedAtInBasket ?
                    transaction.createdAt : maxTransactionsCreatedAtInBasket;
        });
        // if (allBlocks.length === 0) {
        //     previousBlock = BlockRepo.getGenesisBlock();
        //     timestamp = SlotService.getTruncTime();
        // } else {
        //     previousBlock = allBlocks[allBlocks.length - 1];
        //     timestamp -= timestamp - 10;
        // }

        // const block: Block = this.create({
        //     keyPair,
        //     timestamp,
        //     previousBlock,
        //     transactions
        // });

        basketsWithTransactionsForBlocks.push(new Basket(
            { createdAt: maxTransactionsCreatedAtInBasket, transactions: transactions }));

        ++count;
    } while (transactions.length > 0);

    console.log(`FINISH create basket! Created: ${count} baskets!`);
}

function changeSendAndStakeTrsOrder() {
    console.log('START CHANGE SEND AND STAKE ORDER');
    const setAddress: Set<number> = new Set();
    const mapAddressIndex: Map<number, number> = new Map();

    for (let i = 0; i < correctTransactions.length; i++) {
        const address: number = Number(getAddressByPublicKey(correctTransactions[i].senderPublicKey));
        if (!setAddress.has(address)) {
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
    console.log('FINISH CHANGE SEND AND STAKE ORDER');
}

async function addMoneyForNegativeBalanceAccounts() {
    const accounts: Map<number, number> = await readAccountsToMap(filePathAddressesWithNegativeBalance);
    console.log('START FIX NEGATIVE BALANCES', accounts.size);
    let lastRegisterIndexCount = 0;
    let createdAtRegisterTrs = 0;
    for (let i = 0; i < correctTransactions.length; i++) {
        const transaction = correctTransactions[i];
        if (transaction.type === TransactionType.REGISTER && createdAtRegisterTrs === 0) {
            lastRegisterIndexCount = i;
            createdAtRegisterTrs = transaction.createdAt;
        } else if (transaction.type === TransactionType.REGISTER && transaction.createdAt === createdAtRegisterTrs) {
            ++lastRegisterIndexCount;
        } else if (i - lastRegisterIndexCount > 1000) {
            break;
        }
    }

    const additionalSendTransactions: Array<Transaction<IAsset>> = [];
    const senderPublicKey = 'b12a7faba4784d79c7298ce49ef5131b291abd70728e6f2bd1bc2207ea4b7947';
    const keyPair: IKeyPair = getKeyPair(senderPublicKey);
    accounts.forEach(((value, key) => {
        const additionalSendTransaction = new TransactionDTO({
            type: TransactionType.SEND,
            senderPublicKey: senderPublicKey,
            createdAt: createdAtRegisterTrs + 1,
            asset: {
                recipientAddress: key,
                amount: Math.abs(value)
            }
        });
        additionalSendTransactions.push(TransactionService.create(new TransactionModel(additionalSendTransaction),
            keyPair).data);
    }));
    correctTransactions.splice(lastRegisterIndexCount, 0, ...additionalSendTransactions);
    console.log('FINISH FIX NEGATIVE BALANCES');
}

export function popTransactionsForMigration(quantity: number) {
    console.log('Left transactions for migration: ', correctTransactions.length);
    if (correctTransactions.length > quantity) {
        return correctTransactions.splice(correctTransactions.length - (quantity + 1), quantity);
    }
    return correctTransactions.splice(0, correctTransactions.length);
}

function readTransactionsToArray(filePath): Promise<Array<Object>> {
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
            resolve(transactions);
        });
    });

}

function readTransactionsToMap(filePath): Promise<Map<string, object>> {

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
            resolve(transactions);
        });
    });
}

function readAccountsToMap(filePath): Promise<Map<number, number>> {

    let count = 0;

    return new Promise((resolve, reject) => {
        const accounts: Map<number, number> = new Map();

        fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            accounts.set(Number(data.address.replace(/DDK/ig, '')), Number(data.amount));
            ++count;
        })
        .on('end', () => {
            console.log('Parsed accounts with negative balance: ', count);
            resolve(accounts);
        });
    });
}

function getKeyPair(secret: string): IKeyPair {
    const hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
    return ed.makeKeyPair(hash);
}

function getFormattedDate() {
    let date = new Date();
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
        date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

}

