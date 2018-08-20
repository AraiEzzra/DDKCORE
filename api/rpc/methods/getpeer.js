const { createServerRPCMethod, validator } = require('./../util');
const { getPeer } = require('../../../schema/peers');


const METHOD_NAME = 'getpeer';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetPeer (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, getPeer)) {
      scope.modules.peers.shared.getPeer({body: params}, (error, result) => {

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

module.exports = createServerRPCMethod(METHOD_NAME, GetPeer);
