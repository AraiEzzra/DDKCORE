import config from 'shared/config';
import { Delegate } from 'shared/model/delegate';
import BlockRepository from 'core/repository/block';
import DelegateRepository from 'core/repository/delegate';

class DelegateService {
    public getActiveDelegatesCount = (): number => {
        const lastBlockHeight = BlockRepository.getLastBlock().height;

        const activeDelegatesConfigs = [...config.CONSTANTS.ACTIVE_DELEGATES.entries()]
            .filter(([height]) => height < lastBlockHeight);

        const [, activeDelegatesCount] = activeDelegatesConfigs[activeDelegatesConfigs.length - 1];

        return activeDelegatesCount;
    }

    public getAllActiveDelegates = (): Array<Delegate> => {
        const delegates = DelegateRepository.getAll();
        const activeDelegatesCount = this.getActiveDelegatesCount();

        return delegates.sort((a, b) => {
            const voteCountDifference = a.confirmedVoteCount - b.confirmedVoteCount;
            if (voteCountDifference) {
                return voteCountDifference;
            }

            if (a.account.publicKey > b.account.publicKey) {
                return 1;
            }
            if (a.account.publicKey < b.account.publicKey) {
                return -1;
            }
            return 0;
        }).slice(0, activeDelegatesCount);
    }

    public getActiveDelegates = (limit: number = 10, offset: number = 0): Array<Delegate> => {
        return this.getAllActiveDelegates().slice(offset, offset + limit);
    }
}

export default new DelegateService();
