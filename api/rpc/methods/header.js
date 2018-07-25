const ReservedErrorCodes = require('./../errors');
const {
  METHOD_RESULT_STATUS,
  createServerMethod,
  prepareServerError,
  prepareServerMethodResult,
  hasProperties,
} = require('./../util');



const METHOD_NAME = 'header';


function Header (wss, params) {

  let response = {};
  let errorCode = false;
  let errorMessage = 'Error Message';

  if (params) {
    response.title = 'Title Header';
    response.data = 'Data resend ' +  params.trx + params.source ;
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

module.exports = createServerMethod(METHOD_NAME, Header);
