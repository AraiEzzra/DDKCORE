const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'search';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function Search (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.delegates.shared.search({body: params}, (error, result) => {

      resolve(error
        ? {error}
        : result);
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, Search);
