const { createServerRPCMethod } = require('../util');


module.exports = createServerRPCMethod(
    'GET_ACCOUNT',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        scope.modules.accounts.shared.getAccount({ body: params }, (error, result) => {
            resolve(error
                ? { error }
                : result);
        });
    }));
