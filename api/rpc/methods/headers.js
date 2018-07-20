const ReservedErrorCodes = require('./../errors');


// Method of ServerRPCApi
function MethodHeaders (params) {

  const webSocketServer = this.getWebSocketServer();
  const createError = this.createError;

  let response = {};
  let errorCode = false;
  let errorMessage = 'Error Message';

  console.log(params);
  if (params.trx) {
    response.title = 'Title Headers';
    response.data = 'Data resend';
  } else {
    errorCode = ReservedErrorCodes.ServerErrorInvalidMethodParameters;
    errorMessage = ReservedErrorCodes[errorCode];
  }

  return errorCode
    ? createError(errorCode, errorMessage, response)
    : response;
}

MethodHeaders.methodName = 'headers';

module.exports = MethodHeaders;