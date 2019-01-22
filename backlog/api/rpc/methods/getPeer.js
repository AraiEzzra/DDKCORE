const { createServerRPCMethod, schemaValidator } = require('../util');
const ReservedError = require('../errors');
const { getPeer } = require('../../../schema/peers');


module.exports = createServerRPCMethod(
    'GET_PEER',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        if (schemaValidator(params, getPeer)) {
            scope.modules.peers.shared.getPeer({ body: params }, (error, result) => {
                resolve(error
                    ? { error }
                    : result);
            });
        } else {
            return { error: ReservedError.ServerErrorInvalidMethodParameters };
        }
    }));
