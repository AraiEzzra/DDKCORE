const { createServerRPCMethod, validator } = require('./../util');
const { getPeers } = require('../../../schema/peers');


const METHOD_NAME = 'getpeers';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetPeers (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, getPeers)) {
      scope.modules.peers.shared.getPeers({body: params}, (error, result) => {

        resolve(error
          ? {error}
          : result);
      });
    }
    else {
      return {error: 'Failed operation'}
    }

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetPeers);
