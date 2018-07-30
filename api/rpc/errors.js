
const ReservedErrorCodes = {
  ParseErrorNotWellFormed: -32700,
  ParseErrorUnsupportedEncoding: -32701,
  ParseErrorInvalidCharacter: -32702,
  ServerErrorInvalidXmlRpc: -32600,
  ServerErrorRequestedMethodNotFound: -32601,
  ServerErrorInvalidMethodParameters: -32602,
  ServerErrorInternalXmlRpc: -32603,
  ApplicationError: -32500,
  SystemError: -32400,
  TransportError: -32300,
  '-32700': 'Parse error. Not well formed',
  '-32701': 'Parse error. Unsupported encoding',
  '-32702': 'Parse error. Invalid character for encoding',
  '-32600': 'Server error. Invalid xml-rpc. not conforming to spec.',
  '-32601': 'Server error. Requested method not found',
  '-32602': 'Server error. Invalid method parameters',
  '-32603': 'Server error. Internal xml-rpc error',
  '-32500': 'Application error',
  '-32400': 'System error',
  '-32300': 'Transport error',
};

module.exports = ReservedErrorCodes;
