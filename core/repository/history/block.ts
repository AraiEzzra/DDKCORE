import { HistoryRepository } from 'core/repository/history';
import { BlockHistoryEvent } from 'shared/model/types';
import { Block } from 'shared/model/block';

export default new HistoryRepository<Block, BlockHistoryEvent>();
