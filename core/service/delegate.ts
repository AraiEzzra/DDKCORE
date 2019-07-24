import config from 'shared/config';
import { Delegate } from 'shared/model/delegate';
import BlockRepository from 'core/repository/block';
import DelegateRepository, { sortingDelegateFuncs } from 'core/repository/delegate';
import { Pagination, Sort, customSort } from 'shared/util/common';
import { ResponseActiveDelegates } from 'shared/model/types';

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
            if (a.confirmedVoteCount < b.confirmedVoteCount) {
                return 1;
            }
            if (a.confirmedVoteCount > b.confirmedVoteCount) {
                return -1;
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

    public getActiveDelegates = (
        filter: Pagination,
        sort: Array<Sort>,
    ): { delegates: Array<Delegate>, count: number } => {
        const activeDelegates = this.getAllActiveDelegates();

        if (sort && sort.length) {
            return {
                delegates: customSort<Delegate>(activeDelegates, sortingDelegateFuncs, { ...filter, sort }),
                count: activeDelegates.length,
            };
        }

        return {
            delegates: activeDelegates.slice(filter.offset, filter.offset + filter.limit),
            count: activeDelegates.length,
        };
    }
}

export default new DelegateService();
