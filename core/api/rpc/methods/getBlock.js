const { createServerRPCMethod, schemaValidator } = require('../util');
const ReservedError = require('../errors');
const { getBlock } = require('../../../schema/blocks');


module.exports = createServerRPCMethod(
    'GET_BLOCK',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        if (schemaValidator(params, getBlock)) {
            scope.modules.blocks.submodules.api.getBlock({ body: params }, (error, result) => {
                resolve(error
                    ? { error }
                    : result);
            });
        } else {
            return { error: ReservedError.ServerErrorInvalidMethodParameters };
        }
    }));
