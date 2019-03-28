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
        const totalSupplyAccount = AccountRepository.getByAddress(config.CONSTANTS.TOTAL_SUPPLY.ADDRESS);
        const totalSupply = totalSupplyAccount ? totalSupplyAccount.actualBalance : 0;
        const circulatingSupply = config.CONSTANTS.TOTAL_SUPPLY.AMOUNT - totalSupply;
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
