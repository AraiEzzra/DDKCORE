import { IDatabase } from 'pg-promise';
import { TransactionId } from 'ddk.registry/dist/model/common/type';

import { IAssetRegister, IAssetStake, IAssetTransfer, TransactionModel } from 'shared/model/transaction';
import { RawAsset } from 'shared/model/types';
import TransactionSendRepository from 'shared/repository/transaction/asset/send';
import TransactionReferralRepository from 'shared/repository/transaction/asset/register';
import TransactionStakeRepository from 'shared/repository/transaction/asset/stake';
import TransactionVoteRepository from 'shared/repository/transaction/asset/vote';
import { BufferTypes } from 'shared/util/byteSerializer/types';
import { createBufferObject, deserialize } from 'shared/util/byteSerializer';
import { SchemaName } from 'shared/util/byteSerializer/config';

const MAX_ADDRESS = '18446744073709551615';

const getSendTransactionsWithLongAddressesQuery = `
    select * from (
        select CAST (t.recipient_address AS numeric) as number_address, * from (
            select id, jsonb_extract_path_text(trs.asset, 'recipientAddress') as recipient_address, sender_public_key, asset from trs where type = 10
        ) t where t.recipient_address is not null
    ) t where number_address > ${MAX_ADDRESS};`;

const getReferralTransactionsWithLongAddressesQuery = `
    select * from (
        select CAST (t.referral AS numeric) as number_address, * from (
            select id, jsonb_extract_path_text(trs.asset, 'referral') as referral, sender_public_key, asset from trs where type = 0
        ) t
    ) t where number_address > ${MAX_ADDRESS};`;

const getStakeTransactionWithLongSponsorsAddressesQuery = `
  select id, asset, sender_public_key
    from trs,
  LATERAL
    json_array_elements(trs.asset::json->'airdropReward'->'sponsors') sponsor
      where CAST(sponsor->> 0 as numeric) > ${MAX_ADDRESS} and type = 40`;

const getVoteTransactionWithLongSponsorsAddressesQuery = `
  select id, asset, sender_public_key
    from trs,
  LATERAL
    json_array_elements(trs.asset::json->'airdropReward'->'sponsors') sponsor
      where CAST(sponsor->> 0 as numeric) > ${MAX_ADDRESS} and type = 60`;


const uint64 = new BufferTypes.Uint64();

const migrateSendTransactions = async (db: IDatabase<any>) => {

    const serializedSendTransactions: Array<TransactionModel<RawAsset>> =
        await db.manyOrNone(getSendTransactionsWithLongAddressesQuery);

    const data: Map<TransactionId, IAssetTransfer> = new Map();

    for (const rawTransaction of serializedSendTransactions) {
        const asset = TransactionSendRepository.deserialize({
            ...rawTransaction.asset,
            recipientAddress: deserialize(uint64.create(BigInt(rawTransaction.asset.recipientAddress))),
        });

        data.set(rawTransaction.id, asset);

        const serializedAsset = TransactionSendRepository.serialize(asset);

        await db.query(`UPDATE trs SET asset = $1 WHERE id = $2`, [serializedAsset, rawTransaction.id]);
    }
};

const migrateReferralTransactions = async (db: IDatabase<any>) => {

    const serializedReferralTransactions: Array<TransactionModel<RawAsset>> =
        await db.manyOrNone(getReferralTransactionsWithLongAddressesQuery);

    const data: Map<TransactionId, IAssetRegister> = new Map();

    for (const rawTransaction of serializedReferralTransactions) {
        const asset = TransactionReferralRepository.deserialize({
            ...rawTransaction.asset,
            referral: deserialize(uint64.create(BigInt(rawTransaction.asset.referral))),
        });

        data.set(rawTransaction.id, asset);

        const serializedAsset = TransactionReferralRepository.serialize(asset);

        await db.query(`UPDATE trs SET asset = $1 WHERE id = $2`, [serializedAsset, rawTransaction.id]);
    }
};

const migrateStakeTransactions = async (db: IDatabase<any>) => {

    const serializedStakeTransactions: Array<TransactionModel<RawAsset>> =
        await db.manyOrNone(getStakeTransactionWithLongSponsorsAddressesQuery);

    const data: Set<TransactionId> = new Set();

    for (const rawTransaction of serializedStakeTransactions) {
        const asset = TransactionStakeRepository.deserialize(rawTransaction.asset);

        const migratedAsset = deserialize(createBufferObject(asset, SchemaName.TransactionAssetStake));

        const serializedAsset = TransactionStakeRepository.serialize(
            migratedAsset
        );
        if (data.has(rawTransaction.id)) {
            continue;
        }
        data.add(rawTransaction.id);

        await db.query(`UPDATE trs SET asset = $1 WHERE id = $2`, [serializedAsset, rawTransaction.id]);
    }
};

const migrateVoteTransactions = async (db: IDatabase<any>) => {

    const serializedStakeTransactions: Array<TransactionModel<RawAsset>> =
        await db.manyOrNone(getVoteTransactionWithLongSponsorsAddressesQuery);

    const data: Set<TransactionId> = new Set();

    for (const rawTransaction of serializedStakeTransactions) {
        const asset = TransactionVoteRepository.deserialize(rawTransaction.asset);

        const migratedAsset = deserialize(createBufferObject(asset, SchemaName.TransactionAssetVote));

        const serializedAsset = TransactionVoteRepository.serialize(
            migratedAsset
        );

        if (data.has(rawTransaction.id)) {
            continue;
        }
        data.add(rawTransaction.id);

        await db.query(`UPDATE trs SET asset = $1 WHERE id = $2`, [serializedAsset, rawTransaction.id]);
    }
};

const migrate = async (db: IDatabase<any>) => {
    await migrateSendTransactions(db);
    await migrateReferralTransactions(db);
    await migrateStakeTransactions(db);
    await migrateVoteTransactions(db);
};

export default migrate;
