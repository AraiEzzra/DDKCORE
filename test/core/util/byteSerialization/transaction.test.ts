import { serializeAssetTransaction } from 'shared/util/transaction';
import { createBufferArray, createBufferObject, deserialize } from 'shared/util/byteSerializer';
import { SchemaName } from 'shared/util/byteSerializer/config';
import {
    allTransactions,
    transactionWithNullSecondSignature,
    transactionWithoutSecondSignature, transactionWithSecondSignature
} from 'test/core/util/byteSerialization/mock';
import { expect } from 'chai';
import { Transaction, TransactionType } from 'shared/model/transaction';
import { BufferTypes } from 'shared/util/byteSerializer/types';

describe('Transaction byte serialize', () => {

    describe('Transaction one by one', () => {

        allTransactions.forEach((trs: Transaction<any>) => {
            it(TransactionType[trs.type], () => {

                const transaction = new Transaction(trs);
                const byteAssetTransaction = serializeAssetTransaction(transaction);
                const byteTransaction: Buffer = createBufferObject(byteAssetTransaction, SchemaName.OldTransaction);

                expect(deserialize(byteTransaction)).to.deep.equal(transaction);
            });
        });
    });

    it('Transaction in array', () => {

        const transactions = allTransactions.map((trs: Transaction<any>) => serializeAssetTransaction(trs));
        const byteArray: Buffer = createBufferArray(
            transactions,
            new BufferTypes.Object(SchemaName.OldTransaction)
        );

        expect(deserialize(byteArray)).to.deep.equal(allTransactions);
    });

    it('Transaction with null second signature', () => {
        const transaction = new Transaction(transactionWithNullSecondSignature);
        const byteAssetTransaction = serializeAssetTransaction(transaction);
        const byteTransaction: Buffer = createBufferObject(byteAssetTransaction, SchemaName.Transaction);

        expect(deserialize(byteTransaction)).to.deep.equal(transaction);
    });

    it('Transaction without second signature', () => {
        const transaction = new Transaction(transactionWithoutSecondSignature);
        const byteAssetTransaction = serializeAssetTransaction(transaction);
        const byteTransaction: Buffer = createBufferObject(byteAssetTransaction, SchemaName.Transaction);

        expect(deserialize(byteTransaction)).to.deep.equal(transaction);
    });
    it('Transaction with second signature', () => {
        const transaction = new Transaction(transactionWithSecondSignature);
        const byteAssetTransaction = serializeAssetTransaction(transaction);
        const byteTransaction: Buffer = createBufferObject(byteAssetTransaction, SchemaName.Transaction);

        expect(deserialize(byteTransaction)).to.deep.equal(transaction);
    });
});
