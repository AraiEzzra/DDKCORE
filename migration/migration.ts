import { IAsset, Transaction, TransactionModel, TransactionType } from 'shared/model/transaction';
import { TransactionDTO } from 'migration/utils/TransactionDTO';
import TransactionService from 'core/service/transaction';
import crypto from 'crypto';
import { ed, IKeyPair } from 'shared/util/ed';
import Loader from 'core/loader';
import { getAddressByPublicKey } from 'shared/util/account';

const csv = require('csv-parser');
const fs = require('fs');

const QUANTITY_PARSE_TRS = 1000;

const secret = 'sing traffic unfold witness fruit frame bonus can cost warrior few flock';

const mapOldAndNewDelegatesPublicKey: Map<string, string> = new Map([
    ['276f0d09e64b68566fb458b7c71aeb62411d0b633ad6c038e5a4a042ec588af9', '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05'],
    ['3f0348b6d3ecaeaeca0a05ee4c2d7b4b7895ef0a12d8023ba245b6b8022833e5', 'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7'],
    ['3f1ecf6de517a6bf2f5c7a8226a478dc571ed0100d53ee104842f4d443e49806', '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a'],
    ['2432531ba2ed00f673d7742bf3894bf31ef80cc2253c4347e4450a30f8bba06f', 'bf39c78c418e8b270fbb57537fee56bde776c449e01c5330dbe1daf1c44bbb33'],
    ['1beb2d8cf4b1b849a443cd236c0ec194ead6390f4b0671cdb008d0558e252b91', '1de2f26471c9a46fa30ab357a378e0df6a2d22f757edc88ec8f8eb6897cea56a'],
    ['d4999726b7db7e0e5c0d5f441e43d0e0b471aebb46178b9286f275f1f5911208', '485e5e9da8a5960645fd133b6b80dc613db115fb6aaf802b2adab775db365d06'],
    ['ca3ccbb56fd111b31f11818bfd8b38d3c77b84a2ebd4983e4584eda4d7197e41', '23efdae2f13e70db15b9c32415cbf5dfb37eb0d546cfa57244a34a823434fa37'],
    ['33ecad8ba399744276b9fb43480537141f84b369c235044bffc43536a9ff19b5', 'dbdca1c3c7c36f61f7f93684607cc663a33163d1c6f10d827f1ddc049993cffc'],
    ['ed6e8f15d1e6495fe613b42af080c84f8b6e23148686c4851d82287785265332', '44ca95e90fa08cfe25940acfd0202c9bb33c97757987f2f4c482fbe70a4e8f33'],
    ['e1c567be066129f28f23f1b90fe76d5d45661f64b1f38426cca4f3c77d1a92f4', '48eef7e87948611958c10dee9463d73fe987533acf8c1f3980e1757d2d17b573'],
    ['6690354691aa0374dca6ff7dd643d1e5a3e5f5fb97c1170413a7ba4c0efb1a4f', '63778928fdc0d35bd19919004fa6b20d754077dc562f97b570cd85917909ecb4'],
]);

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
                    // if(votes.length > 0){
                    //     for (let i = 0; i < votes.length; i++){
                    //         let vote = votes[i].slice(0,1);
                    //         let delegatePublicKey = votes[i].slice(1,votes[i].length);
                    //        
                    //         if (mapOldAndNewDelegatesPublicKey.has(delegatePublicKey)) {
                    //             votes[i] = vote + mapOldAndNewDelegatesPublicKey.get(delegatePublicKey);
                    //         } 
                    //        
                    //     } 
                    // }
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

    await addMoneyForNegativeBalanceAccounts();
    
    
    newTrs.length = 0;
    oldTrs.clear();
    
    console.log('newTrs length: ', newTrs.length);
    console.log('oldTrs size: ', oldTrs.size);
    console.log('Prepared transactions: ', correctTransactions.length);


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

