import { BlockId } from 'ddk.registry/dist/model/common/type';

import { BlockHeaders } from 'shared/model/headers/block';

export const BlockHeadersStorage = new Map<BlockId, BlockHeaders>();
