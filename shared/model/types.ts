import { TransactionLifecycle, BlockLifecycle } from 'shared/model/transaction';
import { Account, AccountChangeAction } from 'shared/model/account';
import { Round } from 'shared/model/round';

export type Filter = {
    limit: number;
    offset: number;
};

export type PeerAddress = {
    ip: string;
    port: number;
};

export type RequestPeerInfo = {
    peerAddress: PeerAddress,
    requestId: string,
};

export type BlockData = {
    id: string;
    height: number;
};

export type BlockLimit = {
    height: number,
    limit: number
};

export type HistoryEvent<T> = {
    action: T;
};


export type TransactionHistoryEvent = HistoryEvent<TransactionLifecycle> & {
    accountStateBefore?: Account;
    accountStateAfter?: Account;
    errors?: Array<string>;
};

export type BlockHistoryState = {
    prevRound: Round,
    round: Round,
};

export type BlockHistoryEvent = HistoryEvent<BlockLifecycle> & {
    state?: BlockHistoryState,
};

export type SerializedTransactionHistoryAction = {
    action: TransactionLifecycle;
    accountStateBefore?: SerializedAccount;
    accountStateAfter?: SerializedAccount;
};

export type AccountState = {
    action: AccountChangeAction,
    state: Account,
    transactionId: TransactionId
};

export type SerializedAccountState = {
    action: AccountChangeAction,
    state: SerializedAccount,
    transactionId: TransactionId
};

export type SerializedAccount = object;

export type TransactionId = string;
export type RawTransaction = { [key: string]: any };
export type RawAsset = { [key: string]: any };
export type Address = BigInt;
export type PublicKey = string;
export type Timestamp = number;
export type AirdropReward = Map<Address, number>;
