const { createServerRPCMethod } = require('../util');

module.exports = createServerRPCMethod(
    'ADD_DELEGATE',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        scope.modules.delegates.shared.addDelegate({ body: params }, (error, result) => {
            resolve(error
                ? { error }
                : result);
        });
    }));
