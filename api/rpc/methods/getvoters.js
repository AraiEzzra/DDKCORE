const { createServerRPCMethod, validator } = require('./../util');
const { getVoters } = require('../../../schema/delegates');


const METHOD_NAME = 'getvoters';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetVoters (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, getVoters)) {
      scope.modules.delegates.shared.getVoters({body: params}, (error, result) => {

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

module.exports = createServerRPCMethod(METHOD_NAME, GetVoters);
