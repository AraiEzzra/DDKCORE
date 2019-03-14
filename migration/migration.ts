import { IAsset, TransactionModel, TransactionType } from 'shared/model/transaction';
const csv = require('csv-parser');
const fs = require('fs');

const transactions = [];

fs.createReadStream('/home/vitaliy/projects/ddk_deploy/transactions.csv')
.pipe(csv())
.on('data', (data) => {
    transactions.push(data);
})
.on('end', () => {
    console.log('##########################');
    transactionsHandler(transactions);
    // console.log(transactions);
    // [
    //   { NAME: 'Daffy Duck', AGE: '24' },
    //   { NAME: 'Bugs Bunny', AGE: '22' }
    // ]
});

// const file = readFileSync('/home/vitaliy/projects/ddk_deploy/transactions.json', 'utf8');
// const transactions: Array<object> = JSON.parse(fs.readFileSync(filePath).toString());

function transactionsHandler(transactions) {
    const newTransactions: Array<TransactionModel<IAsset>> = [];

    transactions.forEach(
        function <T extends IAsset>(transaction) {
            let newTransaction: TransactionModel<T>;
            console.log('RRRRRRRRRRRRRRRRRRRRRRRRR', transaction);
            switch (transaction.type) {
                case TransactionType.REGISTER:
                    console.log('GGGGGGGGGGGGGGGGGG');

                    newTransaction = Object.assign(transaction, { asset: { referral: transaction.referrals[1] } });
                    break;
                case TransactionType.SEND:
                    newTransaction = Object.assign(transaction,
                        { asset: { recipientAddress: transaction.recipientAddress, amount: transaction.amount} });
                    break;
                case TransactionType.SIGNATURE:
                    newTransaction = Object.assign(transaction, { asset: { publicKey: transaction.secondPublicKey } });
                    break;
                case TransactionType.DELEGATE:
                    newTransaction = Object.assign(transaction, { asset: { username: transaction.username } });
                    break;
                case TransactionType.STAKE:
                    newTransaction = Object.assign(transaction, { asset: { amount: transaction.amount,
                            startTime: transaction.startTime,
                            airdropReward: transaction.airdropReward ? transaction.airdropReward.sponsors : transaction.airdropReward } });
                    break;
                case TransactionType.SENDSTAKE:
                    newTransaction = Object.assign(transaction, { asset: { recipientAddress: transaction.recipientAddress } });
                    break;
                case TransactionType.VOTE:
                    newTransaction = Object.assign(transaction, { asset: { votes: transaction.votes,
                            reward: transaction.reward, unstake: transaction.unstake, airdropReward: transaction.airdropReward } });
                    break;
                default:
                    newTransaction = Object.assign(transaction, { asset: {} });

            }
            delete newTransaction.referrals;
            delete newTransaction.recipientAddress;
            delete newTransaction.amount;
            delete newTransaction.username;
            delete newTransaction.secondPublicKey;
            delete newTransaction.airdropReward;
            delete newTransaction.startTime;
            delete newTransaction.sponsors;
            delete newTransaction.unstake;
            delete newTransaction.reward;
            delete newTransaction.votes;
            newTransactions.push(new TransactionModel(newTransaction));

        });

    console.log('***************************', newTransactions);
}

