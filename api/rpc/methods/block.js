const ReservedErrorCodes = require('./../errors');
const {
  METHOD_RESULT_STATUS,
  createServerRPCMethod,
  prepareServerError,
  prepareServerMethodResult,
  hasProperties,
} = require('./../util');



const METHOD_NAME = 'block';

function Block (wss, params) {
  let response = {};
  response.transaction = 'Transaction block';
  return response;
}

module.exports = createServerRPCMethod(METHOD_NAME, Block);
