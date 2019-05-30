import SocketMiddleware from 'core/api/middleware/socket';
import { EVENT_TYPES } from 'shared/driver/socket/codes';
import AccountRepository from 'core/repository/account';
import TransactionRepository from 'core/repository/transaction';
import BlockRepository from 'core/repository/block';
import SyncService from 'core/service/sync';
import config from 'shared/config';
import { Address } from 'shared/model/types';
import TransactionPool from 'core/service/transactionPool';
import TransactionQueue from 'core/service/transactionQueue';
import PeerMemoryRepository from 'core/repository/peer/peerMemory';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';
import { logger } from 'shared/util/logger';
import { MemoryPeer } from 'shared/model/Peer/memoryPeer';
import { NetworkPeer } from 'shared/model/Peer/networkPeer';

export type BlockchainInfo = {
    airdropBalance: number;
    totalSupply: number;
    circulatingSupply: number;
    tokenHolders: number;
    totalStakeAmount: number;
    totalStakeHolders: number;
    transactionsCount: number;
};

export type SystemInfo = {
    height: number;
    consensus: number;
    datetime: Date;
    transactionsCount: {
        queue: number,
        conflictedQueue: number,
        pool: number,
    },
    peersCount: number;
    peers: Array<any>;
    broadhash: string;
    version: string,
};

const LAST_PEER_BLOCKS_COUNT = 10;

class EventService {

    updateBlockchainInfo() {
        const circulatingSupply = config.CONSTANTS.TOTAL_SUPPLY.AMOUNT -
            AccountRepository.getByAddress(config.CONSTANTS.TOTAL_SUPPLY.ADDRESS).actualBalance;
        const statistics = AccountRepository.getStatistics();

        SocketMiddleware.emitEvent<BlockchainInfo>(EVENT_TYPES.UPDATE_BLOCKCHAIN_INFO, {
            totalSupply: config.CONSTANTS.TOTAL_SUPPLY.AMOUNT,
            airdropBalance: AccountRepository.getByAddress(config.CONSTANTS.AIRDROP.ADDRESS).actualBalance,
            circulatingSupply,
            tokenHolders: statistics.tokenHolders,
            totalStakeAmount: statistics.totalStakeAmount,
            totalStakeHolders: statistics.totalStakeHolders,
            transactionsCount: TransactionRepository.size()
        });
    }

    updateSystemInfo() {
        const height = BlockRepository.getLastBlock() ? BlockRepository.getLastBlock().height : 0;
        const broadhash = BlockRepository.getLastBlock() ? BlockRepository.getLastBlock().id : '';
        const peersCount = PeerNetworkRepository.getAll()
            .filter((peer: NetworkPeer) => !peer.isBanned).length;

        const peers = PeerMemoryRepository.getAll().map((peer: MemoryPeer) => {
            const SerializedPeerHeaders = peer.headers.serialize();
            return {
                ...SerializedPeerHeaders,
                ...peer.peerAddress,
                blocksIds: SerializedPeerHeaders.blocksIds
                    .sort((a: [number, string], b: [number, string]) => b[0] - a[0])
                    .splice(0, LAST_PEER_BLOCKS_COUNT)
            };
        });

        SocketMiddleware.emitEvent<SystemInfo>(EVENT_TYPES.UPDATE_SYSTEM_INFO, {
            height,
            peers,
            peersCount,
            broadhash,
            consensus: SyncService.getConsensus(),
            datetime: new Date(),
            version: config.CORE.VERSION,
            transactionsCount: {
                queue: TransactionQueue.getSize().queue,
                conflictedQueue: TransactionQueue.getSize().conflictedQueue,
                pool: TransactionPool.getSize(),
            },
        });
    }
}

export default new EventService();
