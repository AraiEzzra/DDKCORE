const { createServerRPCMethod } = require('../util');


module.exports = createServerRPCMethod(
    'GET_DELEGATES',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        scope.modules.delegates.shared.getDelegates({ body: params }, (error, result) => {
            resolve(error
                ? { error }
                : result);
        });
    }));
