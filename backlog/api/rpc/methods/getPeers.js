const { createServerRPCMethod, schemaValidator } = require('../util');
const ReservedError = require('../errors');
const { getPeers } = require('../../../schema/peers');


module.exports = createServerRPCMethod(
    'GET_PEERS',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        if (schemaValidator(params, getPeers)) {
            scope.modules.peers.shared.getPeers({ body: params }, (error, result) => {
                resolve(error
                    ? { error }
                    : result);
            });
        } else {
            return { error: ReservedError.ServerErrorInvalidMethodParameters };
        }
    }));
