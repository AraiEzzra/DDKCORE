const { createServerRPCMethod } = require('../util');


module.exports = createServerRPCMethod(
    'GET_BLOCKS_COUNT',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        scope.modules.blocks.submodules.api.getBlocks({ body: { limit: 1 } }, (error, result) => {
            resolve(error
                ? { error }
                : { count: result.count });
        });
    }));
