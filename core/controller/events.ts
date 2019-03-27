import { BaseController } from 'core/controller/baseController';
import SocketMiddleware from 'core/api/middleware/socket';
import { EVENT_TYPES } from 'shared/driver/socket/codes';
import AccountRepository from 'core/repository/account';
import config from 'shared/util/config';

export type BlockchainInfo = {
    totalSupply: number;
    circulatingSupply: number;
    tokenHolders: number;
    totalStakeAmount: number;
    totalStakeholders: number;
};


class EventController extends BaseController {

    updateBlockchainInfo() {
        const totalSupply = AccountRepository.getByAddress(config.config.forging.totalSupplyAccount).actualBalance;
        const circulatingSupply = config.constants.totalAmount -
            AccountRepository.getByAddress(config.config.forging.totalSupplyAccount).actualBalance;
        const statistics = AccountRepository.getStatistics();

        SocketMiddleware.emitEvent<{ info: BlockchainInfo }>(EVENT_TYPES.UPDATE_BLOCKCHAIN_INFO, {
            info: {
                totalSupply,
                circulatingSupply,
                tokenHolders: statistics.tokenHolders,
                totalStakeAmount: statistics.totalStakeAmount,
                totalStakeholders: statistics.totalStakeholders
            }
        });
    }
}

export default new EventController();
