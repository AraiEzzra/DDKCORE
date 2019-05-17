import SocketMiddleware from 'core/api/middleware/socket';
import { EVENT_TYPES } from 'shared/driver/socket/codes';
import AccountRepository from 'core/repository/account';
import BlockRepository from 'core/repository/block';
import SyncService from 'core/service/sync';
import config from 'shared/config';
import { Address } from 'shared/model/types';
import TransactionPool from 'core/service/transactionPool';
import TransactionQueue from 'core/service/transactionQueue';

export type BlockchainInfo = {
    totalSupply: number;
    circulatingSupply: number;
    tokenHolders: number;
    totalStakeAmount: number;
    totalStakeHolders: number;
    height: number;
    consensus: number;
    datetime: Date;
    metrics: {
        queue: number,
        conflictedQueue: number,
        pool: number,
    },
};

class EventService {

    updateBlockchainInfo() {
        const preMinedAccounts = config.CONSTANTS.PRE_MINED_ACCOUNTS.map((address: Address) =>
            AccountRepository.getByAddress(address)
        );
        const circulatingSupply = config.CONSTANTS.TOTAL_SUPPLY.AMOUNT -
            preMinedAccounts.reduce((sum, acc) => sum += (acc ? acc.actualBalance : 0), 0);
        const statistics = AccountRepository.getStatistics();

        SocketMiddleware.emitEvent<BlockchainInfo>(EVENT_TYPES.UPDATE_BLOCKCHAIN_INFO, {
            totalSupply: config.CONSTANTS.TOTAL_SUPPLY.AMOUNT,
            circulatingSupply,
            tokenHolders: statistics.tokenHolders,
            totalStakeAmount: statistics.totalStakeAmount,
            totalStakeHolders: statistics.totalStakeHolders,
            height: BlockRepository.getLastBlock() ? BlockRepository.getLastBlock().height : 0,
            consensus: SyncService.getConsensus(),
            datetime: new Date(),
            metrics: {
                queue: TransactionQueue.getSize().queue,
                conflictedQueue: TransactionQueue.getSize().conflictedQueue,
                pool: TransactionPool.getSize(),
            },
        });
    }
}

export default new EventService();
