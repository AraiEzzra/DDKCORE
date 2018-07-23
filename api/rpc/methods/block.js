const ReservedErrorCodes = require('./../errors');
const {
  createServerApiMethod,
  prepareServerError
} = require('./../util');



const METHOD_NAME = 'block';


function Block (wss, params) {

  let response = {};
  let errorCode = false;
  let errorMessage = 'Error Message';

  if (params) {
    response.title = 'Title block';
    response.data = 'Data block resend';
  } else {
    errorCode = ReservedErrorCodes.ServerErrorInvalidMethodParameters;
    errorMessage = ReservedErrorCodes[errorCode];
  }

  return errorCode
    ? prepareServerError(errorCode, errorMessage, response)
    : response;
}

module.exports = createServerApiMethod(METHOD_NAME, Block);
