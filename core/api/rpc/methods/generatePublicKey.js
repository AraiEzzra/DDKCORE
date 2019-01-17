const { createServerRPCMethod } = require('../util');


module.exports = createServerRPCMethod(
    'GENERATE_PUBLICKEY',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {
        scope.modules.accounts.shared.generatePublicKey({ body: params }, (error, result) => {
            resolve(error
                ? { error }
                : result);
        });
    }));
