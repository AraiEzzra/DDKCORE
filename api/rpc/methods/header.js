const ReservedErrorCodes = require('./../errors');


// Method of ServerRPCApi
function MethodHeader (params) {

  const webSocketServer = this.getWebSocketServer();
  const createError = this.createError;

  let response = {};
  let errorCode = false;
  let errorMessage = 'Error Message';

  if (params) {
    response.title = 'Title Header';
    response.data = 'Data resend';
  } else {
    errorCode = ReservedErrorCodes.ServerErrorInvalidMethodParameters;
    errorMessage = ReservedErrorCodes[errorCode];
  }

  return errorCode
    ? createError(errorCode, errorMessage, response)
    : response;
}

MethodHeader.methodName = 'header';

module.exports = MethodHeader;