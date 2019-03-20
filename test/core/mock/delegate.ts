import genesisBlock from 'config/default/genesisBlock.json';
import { TransactionType } from 'shared/model/transaction';

const transactions: any = genesisBlock.transactions;

class DelegateMock {
    private delegates: Array<any> = [];
    private votes: Array<any> = [];

    constructor() {

        for (let i = 0; i < transactions.length; i++) {
            const trs = transactions[i];
            if (trs.type === TransactionType.DELEGATE) {
                this.delegates.push({
                    name: trs.asset.username,
                    publicKey: trs.senderPublicKey,
                    votes: 0
                });
            }
            if (trs.type === TransactionType.VOTE) {
                this.votes.push(...trs.asset.votes);
            }
        }

        for (let i = 0; i < this.delegates.length; i++) {
            for (let j = 0; j < this.votes.length; j++) {
                if ('+' + this.delegates[i].publicKey === this.votes[j]) {
                    this.delegates[i].votes ++;
                }
            }
        }
    }

    public getDelegates(): Array<any> {
        return this.delegates.sort((a, b) => {
            if (a.votes > b.votes) {
                return 1;
            }
            if (a.votes < b.votes) {
                return -1;
            }
            return 0;
        });
    }
}

export default new DelegateMock();
