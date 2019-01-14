const { createServerRPCMethod, schemaValidator } = require('../util');
const ReservedError = require('../errors');
const { forgingStatus } = require('../../../schema/delegates');


module.exports = createServerRPCMethod(
    'GET_FORGING_STATUS',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        if (schemaValidator(params, forgingStatus)) {
            scope.modules.delegates.internal.forgingStatus({ body: params }, (error, result) => {
                resolve(error
                    ? { error }
                    : result);
            });
        } else {
            return { error: ReservedError.ServerErrorInvalidMethodParameters };
        }
    }));
