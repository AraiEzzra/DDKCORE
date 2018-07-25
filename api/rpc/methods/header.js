const ReservedErrorCodes = require('./../errors');
const {
  METHOD_RESULT_STATUS,
  createServerRPCMethod,
  prepareServerError,
  prepareServerMethodResult,
  hasProperties,
} = require('./../util');



const METHOD_NAME = 'header';

function Header (wss, params) {
  let response = {};
  response.transaction = 'Transaction header';
  return response;
}

module.exports = createServerRPCMethod(METHOD_NAME, Header);
