const { createServerRPCMethod } = require('../util');


module.exports = createServerRPCMethod(
    'GET_HEIGHT',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        scope.modules.blocks.submodules.api.getHeight({ body: params }, (error, result) => {
            resolve(error
                ? { error }
                : result);
        });
    }));
