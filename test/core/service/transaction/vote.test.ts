import { expect } from 'chai';

import TransactionVoteService from 'core/service/transaction/vote.ts';
import { Transaction, IAssetVote, TransactionType, TransactionModel } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import SharedTransactionRepo from 'shared/repository/transaction';
import { RawTransaction } from 'shared/model/types';

describe('Vote transaction', () => {
    it('Invalid delegate', () => {
        const serializedTransaction: RawTransaction = {
            id: '5af7818657a87539dba08683fa4b1cd08bc36d1618a544f688244d9eb69fee99',
            type: TransactionType.VOTE,
            fee: 10000,
            senderPublicKey: '7f4224aa0d312eaae8456f8d901962285928a2958d8c2b279a0918533de5f585',
            signature: 'ab4bee7067a1048e004f2e3dd1f4c8a7ce2b34cebde5e686e54320eb83bb35ef2148df5a4' +
                '5696fc792fc31e2cd27e3f5487af537f3d126a281c78c4ca9d5c30b',
            createdAt: 107559404,
            asset: {
                votes: [
                    '+051d381e0e62ae9ef13988013228de0c4de02aba7e797090d4b02496b86075e9',
                ],
                reward: 0,
                unstake: 0,
                airdropReward: {
                    sponsors: [],
                },
            },
        };

        const expectedErrors = [
            'Delegate account not found, vote: +051d381e0e62ae9ef13988013228de0c4de02aba7e797090d4b02496b86075e9',
            'Transaction id: 5af7818657a87539dba08683fa4b1cd08bc36d1618a544f688244d9eb69fee99. ' +
            'Account: 13408829403315012470'
        ];

        const transaction: Transaction<any> = SharedTransactionRepo.deserialize(serializedTransaction);
        const fakeSender: Account = new Account({
            address: 13408829403315012470n,
            publicKey: '7f4224aa0d312eaae8456f8d901962285928a2958d8c2b279a0918533de5f585',
            actualBalance: 100000000,
            votes: [],
            stakes: [],
        });

        const result = TransactionVoteService.verifyUnconfirmed(transaction, fakeSender);

        expect(result.success).to.equal(false);
        expect(result.errors).to.eql(expectedErrors);
    });
});
