import { BlockId } from 'ddk.registry/dist/model/common/type';

import { BlockHeaders } from 'shared/model/headers/block';

export const BlockHeadersRepository = new Map<BlockId, BlockHeaders>();
