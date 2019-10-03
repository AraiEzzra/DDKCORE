import { Timestamp, TransactionId } from 'shared/model/types';
import { SerializedAddress } from 'shared/model/transport/type';

export type SerializedStakeSchema = {
    createdAt: Timestamp;
    isActive: boolean;
    amount: number;
    voteCount: number;
    nextVoteMilestone: Timestamp;
    airdropReward: Array<[SerializedAddress, number]>;
    sourceTransactionId: string;
    dependentTransactions: Array<TransactionId>;
};
