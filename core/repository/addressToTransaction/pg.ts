import { pgpE } from 'shared/driver/db';
import { Transaction, IAsset, TransactionType, IAssetTransfer } from 'shared/model/transaction';

class AddressToTransactionPGRepository {
    private readonly tableName: string = 'address_to_trs';
    private readonly tableFields: Array<string> = [
        'trs_id',
        'recipient_address',
    ];
    private readonly columnSet = new pgpE.helpers.ColumnSet(this.tableFields, { table: this.tableName });

    createInsertQuery(transactions: Array<Transaction<IAsset>>): string {
        const serializedData = transactions
            .filter(transaction => transaction.type === TransactionType.SEND)
            .map((transaction: Transaction<IAssetTransfer>) => ({
                trs_id: transaction.id,
                recipient_address: transaction.asset.recipientAddress.toString(),
            }));

        return pgpE.helpers.insert(serializedData, this.columnSet);
    }
}

export const AddressToTransactionPGRepo = new AddressToTransactionPGRepository();
