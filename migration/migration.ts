import { IAsset, Transaction, TransactionModel, TransactionType } from 'shared/model/transaction';
import { TransactionDTO } from 'migration/utils/TransactionDTO';
import TransactionService from 'core/service/transaction';
import crypto from 'crypto';
import { ed, IKeyPair } from 'shared/util/ed';
import Loader from 'core/loader';
import { getAddressByPublicKey } from 'shared/util/account';

const csv = require('csv-parser');
const fs = require('fs');

// 0 for all transactions
const QUANTITY_PARSE_TRS = 0;

const filePathNewTransactions = './transactionsNew.csv';
const filePathOldTransactions = './transactionsOld.csv';
const filePathAddressesWithNegativeBalance = './addressesWithNegativeBalance.csv';

const correctTransactions: Array<Transaction<IAsset>> = [];

Loader.start();

export async function startPrepareTransactionsForMigration() {
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
                case TransactionType.SENDSTAKE:
                    correctTransaction = new TransactionDTO({
                        ...transaction,
                        asset: {
                            recipientAddress: transaction.recipientAddress.replace(/DDK/ig, '')
                        }
                    });
                    break;
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
                                airdropReward: JSON.stringify(airdropReward.sponsors).
                                replace(/DDK/ig, ''),
                            });
                    }
                    break;
                default:
                    correctTransaction = new TransactionDTO({ ...transaction, asset: {} });

            }

            ++count;
            if(Number.isInteger(count / 1000)){
                console.log('COUNT: ', count);    
            }
            correctTransactions.push(TransactionService.create(new TransactionModel(correctTransaction),
                getKeyPair(correctTransaction.senderPublicKey)).data);
        });

    await changeSendAndStakeTrsOrder();
    await addMoneyForNegativeBalanceAccounts();
    
    
    newTrs.length = 0;
    oldTrs.clear();
    
    console.log('newTrs length: ', newTrs.length);
    console.log('oldTrs size: ', oldTrs.size);
    console.log('Prepared transactions: ', correctTransactions.length);


}

function changeSendAndStakeTrsOrder(){
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
    if ( correctTransactions.length > quantity) {
        return correctTransactions.splice(0, quantity);
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

function getKeyPair(publicKey: string): IKeyPair {
    const hash = crypto.createHash('sha256').update(publicKey, 'utf8').digest();
    return ed.makeKeyPair(hash);
}

