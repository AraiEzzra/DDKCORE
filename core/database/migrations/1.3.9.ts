import { IDatabase } from 'pg-promise';
import { TransactionId } from 'ddk.registry/dist/model/common/type';

import { TransactionModel, IAssetTransfer, IAssetRegister } from 'shared/model/transaction';
import { RawAsset } from 'shared/model/types';
import TransactionSendRepository from 'shared/repository/transaction/asset/send';
import TransactionReferralRepository from 'shared/repository/transaction/asset/register';
import { BufferTypes } from 'shared/util/byteSerializer/types';
import { deserialize } from 'shared/util/byteSerializer';

const MAX_ADDRESS = '18446744073709551615';

const getSendTransactionsWithLongAddressesQuery = `
    select * from (
        select CAST (t.recipient_address AS numeric) as number_address, * from (
            select id, jsonb_extract_path_text(trs.asset, 'recipientAddress') as recipient_address, asset from trs where type = 10
        ) t where t.recipient_address is not null
    ) t where number_address > ${MAX_ADDRESS};`;

const getReferralTransactionsWithLongAddressesQuery = `
    select * from (
        select CAST (t.referral AS numeric) as number_address, * from (
            select id, jsonb_extract_path_text(trs.asset, 'referral') as referral, asset from trs where type = 0
        ) t
    ) t where number_address > ${MAX_ADDRESS};`;

const uint64 = new BufferTypes.Uint64();

const migrateSendTransactions = async (db: IDatabase<any>) => {
    console.log(`load bad send transactions`);

    const serializedSendTransactions: Array<TransactionModel<RawAsset>> =
        await db.manyOrNone(getSendTransactionsWithLongAddressesQuery);

    const data: Map<TransactionId, IAssetTransfer> = new Map();

    for (const rawTransaction of serializedSendTransactions) {
        const asset = TransactionSendRepository.deserialize({
            ...rawTransaction.asset,
            recipientAddress: deserialize(uint64.create(BigInt(rawTransaction.asset.recipientAddress))),
        });

        data.set(rawTransaction.id, asset);

        console.log(`old: ${JSON.stringify(rawTransaction.asset)}, new: ${JSON.stringify(asset)}`);

        const serializedAsset = TransactionSendRepository.serialize(asset);

        await db.query(`UPDATE trs SET asset = $1 WHERE id = $2`, [serializedAsset, rawTransaction.id]);
    }
};

const migrateReferralTransactions = async (db: IDatabase<any>) => {
    console.log(`load bad referral transactions`);

    const serializedReferralTransactions: Array<TransactionModel<RawAsset>> =
        await db.manyOrNone(getReferralTransactionsWithLongAddressesQuery);

    const data: Map<TransactionId, IAssetRegister> = new Map();

    for (const rawTransaction of serializedReferralTransactions) {
        const asset = TransactionReferralRepository.deserialize({
            ...rawTransaction.asset,
            referral: deserialize(uint64.create(BigInt(rawTransaction.asset.referral))),
        });

        data.set(rawTransaction.id, asset);

        console.log(`old: ${JSON.stringify(rawTransaction.asset)}, new: ${JSON.stringify(asset)}`);

        const serializedAsset = TransactionReferralRepository.serialize(asset);

        await db.query(`UPDATE trs SET asset = $1 WHERE id = $2`, [serializedAsset, rawTransaction.id]);
    }
};

const migrate = async (db: IDatabase<any>) => {
    // await migrateSendTransactions(db);
    // await migrateReferralTransactions(db);
};

export default migrate;
