const { createServerRPCMethod } = require('../util');


module.exports = createServerRPCMethod(
    'SET_ACCOUNT_AND_GET',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        scope.modules.accounts.setAccountAndGet(params, (error, result) => {
            resolve(error
                ? { error }
                : result);
        });
    }));
