import { HistoryRepository } from 'core/repository/history';
import { BlockHistoryEvent } from 'shared/model/types';

export default new HistoryRepository<BlockHistoryEvent>();
