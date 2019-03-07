import { Filter } from 'shared/model/types';

export type getReferredListProps = { address: number, filter: Filter };
export type getReferredListByLevelProps = getReferredListProps & { level: number };
