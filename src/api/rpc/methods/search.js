const { createServerRPCMethod } = require('../util');


module.exports = createServerRPCMethod(
    'SEARCH',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        scope.modules.delegates.shared.search({ body: params }, (error, result) => {
            resolve(error
                ? { error }
                : result);
        });
    }));
