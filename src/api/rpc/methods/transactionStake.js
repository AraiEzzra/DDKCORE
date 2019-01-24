const { createServerRPCMethod, schemaValidator } = require('../util');
const ReservedError = require('../errors');
const { addTransactionForFreeze } = require('../../../schema/frogings');


module.exports = createServerRPCMethod(
    'TRANSACTION_STAKE',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        if (schemaValidator(params, addTransactionForFreeze)) {
            scope.modules.frogings.shared.addTransactionForFreeze({ body: params }, (error, result) => {
                resolve(error
                    ? { error }
                    : result);
            });
        } else {
            return { error: ReservedError.ServerErrorInvalidMethodParameters };
        }
    }));
