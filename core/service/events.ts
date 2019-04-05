import SocketMiddleware from 'core/api/middleware/socket';
import { EVENT_TYPES } from 'shared/driver/socket/codes';
import AccountRepository from 'core/repository/account';
import BlockRepository from 'core/repository/block';
import SyncService from 'core/service/sync';
import config from 'shared/config';

export type BlockchainInfo = {
    totalSupply: number;
    circulatingSupply: number;
    tokenHolders: number;
    totalStakeAmount: number;
    totalStakeHolders: number;
    height: number;
    consensus: number;
};


class EventService {

    updateBlockchainInfo() {
        const totalSupplyAccount = AccountRepository.getByAddress(config.CONSTANTS.TOTAL_SUPPLY.ADDRESS);
        const totalSupply = totalSupplyAccount ? totalSupplyAccount.actualBalance : 0;
        const circulatingSupply = config.CONSTANTS.TOTAL_SUPPLY.AMOUNT - totalSupply;
        const statistics = AccountRepository.getStatistics();

        SocketMiddleware.emitEvent<BlockchainInfo>(EVENT_TYPES.UPDATE_BLOCKCHAIN_INFO, {
            totalSupply,
            circulatingSupply,
            tokenHolders: statistics.tokenHolders,
            totalStakeAmount: statistics.totalStakeAmount,
            totalStakeHolders: statistics.totalStakeHolders,
            height: BlockRepository.getLastBlock() ? BlockRepository.getLastBlock().height : 0,
            consensus: SyncService.getConsensus()
        });
    }
}

export default new EventService();
