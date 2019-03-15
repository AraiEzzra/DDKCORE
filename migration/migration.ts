import { IAsset, IAssetVote, TransactionModel, TransactionType } from 'shared/model/transaction';
import { TransactionDTO } from 'migration/utils/TransactionDTO';

const csv = require('csv-parser');
const fs = require('fs');

const filePathNewTransactions = '/home/vitaliy/projects/ddk_deploy/transactionsNew.csv';
const filePathOldTransactions = '/home/vitaliy/projects/ddk_deploy/transactionsOld.csv';

const correctTransactions: Array<TransactionModel<IAsset>> = [];

(async function transactionsHandler() {
    const [newTrs, oldTrs] = [
        await readTransactionsToArray(filePathNewTransactions),
        await readTransactionsToMap(filePathOldTransactions)
    ];
    console.log(newTrs.length, oldTrs.size);
    newTrs.forEach(
        function <T extends IAsset>(transaction) {
            let correctTransaction: TransactionDTO;
            let airdropReward = transaction.airdropReward ? JSON.parse(transaction.airdropReward) : {};
            switch (Number(transaction.type)) {
                case TransactionType.REGISTER:
                    correctTransaction = new TransactionDTO({
                        ...transaction,
                        asset: {
                            referral: transaction.referrals.substr(1)
                            .slice(0, -1)
                            .replace(/DDK/g, '')
                            .split(',')[1]
                        }
                    });
                    break;
                case TransactionType.SEND:
                    correctTransaction = new TransactionDTO({
                        ...transaction,
                        asset: {
                            recipientAddress: transaction.recipientAddress.replace(/DDK/g, ''),
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
                    const oldTransaction = oldTrs.get(transaction.id);
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
                                    .replace(/DDK/g, '')
                                }
                            });
                    }
                    break;
                case TransactionType.SENDSTAKE:
                    correctTransaction = new TransactionDTO({
                        ...transaction,
                        asset: {
                            recipientAddress: transaction.recipientAddress.replace(/DDK/g, '')
                        }
                    });
                    break;
                case TransactionType.VOTE:
                    correctTransaction = new TransactionDTO({
                        ...transaction,
                        asset: {
                            votes: transaction.votes,
                            unstake: Number(transaction.unstake),
                        },
                    });
                    if (Number(transaction.reward) > 0) {
                        Object.assign(correctTransaction,
                            {
                                reward: Number(transaction.reward),
                                airdropReward: JSON.stringify(airdropReward.sponsors).
                                replace(/DDK/g, ''),
                            });
                    }
                    break;
                default:
                    correctTransaction = new TransactionDTO({ ...transaction, asset: {} });

            }

            correctTransactions.push(new TransactionModel(correctTransaction));

        });

    console.log('***************************', correctTransactions);
})();

function readTransactionsToArray(filePath): Promise<Array<Object>> {
    let count = 0;
    return new Promise((resolve, reject) => {

        const transactions: Array<Object> = [];

        fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            // if (count > 999) {
            //     return;
            // }
            transactions.push(data);
            ++count;
        })
        .on('end', () => {
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

            // if (count > 999) {
            //     return;
            // }

            transactions.set(data.id, data);
            ++count;
        })
        .on('end', () => {
            resolve(transactions);
        });
    });
}

