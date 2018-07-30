const { createServerRPCMethod, validator } = require('./../util');
const { getStatus } = require('../../../schema/blocks');


const METHOD_NAME = 'masternodebroadcast';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance,
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function MasterNodeBroadcast (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;
    console.log(scope.modules.system.getBroadhash());

    if (validator(params, getStatus)) {
      scope.modules.blocks.submodules.api.getStatus({body: params}, (error, result) => {

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

module.exports = createServerRPCMethod(METHOD_NAME, MasterNodeBroadcast);