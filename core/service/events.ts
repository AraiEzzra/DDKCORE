import SocketMiddleware from 'core/api/middleware/socket';
import { EVENT_TYPES } from 'shared/driver/socket/codes';
import AccountRepository from 'core/repository/account';
import config from 'shared/config';

export type BlockchainInfo = {
    totalSupply: number;
    circulatingSupply: number;
    tokenHolders: number;
    totalStakeAmount: number;
    totalStakeholders: number;
};


class EventService {

    updateBlockchainInfo() {
        const totalSupply = AccountRepository.getByAddress(config.CONSTANTS.TOTAL_SUPPLY.ADDRESS).actualBalance;
        const circulatingSupply = config.CONSTANTS.TOTAL_SUPPLY.AMOUNT -
            AccountRepository.getByAddress(config.CONSTANTS.TOTAL_SUPPLY.ADDRESS).actualBalance;
        const statistics = AccountRepository.getStatistics();

        SocketMiddleware.emitEvent<BlockchainInfo>(EVENT_TYPES.UPDATE_BLOCKCHAIN_INFO, {
            totalSupply,
            circulatingSupply,
            tokenHolders: statistics.tokenHolders,
            totalStakeAmount: statistics.totalStakeAmount,
            totalStakeholders: statistics.totalStakeholders
        });
    }
}

export default new EventService();
