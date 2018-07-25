const ReservedErrorCodes = require('./../errors');
const {
  METHOD_RESULT_STATUS,
  createServerMethod,
  prepareServerError,
  prepareServerMethodResult,
  hasProperties,
  getDDKCoinConfig,
  objectToGetQuery,
} = require('./../util');


const METHOD_NAME = 'blocks';

function Blocks (wss, params) {

  let response = {};
  let errorCode = false;
  let errorMessage = 'Blocks Error';

  if (!params) {

  } else {
    errorCode = ReservedErrorCodes.ServerErrorInvalidMethodParameters;
    errorMessage = ReservedErrorCodes[errorCode];
  }

  if (errorCode) {
    return prepareServerMethodResult(METHOD_RESULT_STATUS.ERROR, {},
      prepareServerError(errorCode, errorMessage, response));
  } else {
    return prepareServerMethodResult(METHOD_RESULT_STATUS.SUCCESS, response,
      false);
  }
}

module.exports = createServerMethod(METHOD_NAME, Blocks);
