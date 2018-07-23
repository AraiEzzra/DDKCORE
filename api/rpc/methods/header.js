const ReservedErrorCodes = require('./../errors');
const {
  createServerApiMethod,
  prepareServerError
} = require('./../util');



const METHOD_NAME = 'header';


function MethodHeader (wss, params) {

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

  return errorCode
    ? prepareServerError(errorCode, errorMessage, response)
    : response;
}

module.exports = createServerApiMethod(METHOD_NAME, MethodHeader);
