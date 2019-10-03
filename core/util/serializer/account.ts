import { Account } from 'shared/model/account';
import { SerializedAccountSchema } from 'shared/model/transport/account';
import SponsorsSerializer from 'core/util/serializer/sponsors';
import { ITransactionRepository } from 'core/repository/transaction';

export class AccountSerializer {
    serialize(account: Account): SerializedAccountSchema {
        return {
            address: account.address.toString(),
            publicKey: account.publicKey,
            secondPublicKey: account.secondPublicKey,
            actualBalance: account.actualBalance,
            votes: account.votes,
            referrals: account.referrals.map(referral => referral.address.toString()),
            stakes: account.stakes.map(stake => ({
                ...stake,
                airdropReward: SponsorsSerializer.serialize(stake.airdropReward),
                dependentTransactions: stake.dependentTransactions.map(trs => trs.id),
            }))
        };
    }

    deserialize(
        schema: SerializedAccountSchema,
        accountsRepository:
        transactionsRepository: ITransactionRepository,
    ): Account {
        return new Account({
            address: BigInt(schema.address),
            publicKey: schema.publicKey,
            secondPublicKey: schema.secondPublicKey,
            actualBalance: schema.actualBalance,
            votes: schema.votes,
            referrals: schema.referrals.map(address => ),
            stakes: schema.stakes.map(stake => ({
                ...stake,
                airdropReward: SponsorsSerializer.deserialize(stake.airdropReward),
                dependentTransactions: stake.dependentTransactions.map(id => transactionsRepository.getById(id)),
            })),
        });
    }
}
