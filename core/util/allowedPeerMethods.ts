import { ActionTypes } from 'core/util/actionTypes';

export const ALLOWED_BAN_PEER_METHODS: Set<string> = new Set([
    ActionTypes.PEER_HEADERS_UPDATE,
]);

export const ALLOWED_METHODS: Set<string> = new Set([
    ActionTypes.PEER_HEADERS_UPDATE,
    ActionTypes.PING,
    ActionTypes.BLOCK_RECEIVE,
    ActionTypes.REQUEST_PEERS,
    ActionTypes.REQUEST_COMMON_BLOCKS,
    ActionTypes.REQUEST_BLOCKS,
    ActionTypes.TRANSACTION_RECEIVE,
]);
