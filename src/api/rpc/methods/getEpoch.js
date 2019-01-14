const { createServerRPCMethod } = require('../util');


module.exports = createServerRPCMethod(
    'GET_EPOCH',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        scope.modules.blocks.submodules.api.getEpoch({ body: params }, (error, result) => {
            resolve(error
                ? { error }
                : result);
        });
    }));
