
const ReservedErrorCodes = {
  ParseErrorNotWellFormed: '-32700',
  ParseErrorUnsupportedEncoding: '-32701',
  ParseErrorInvalidCharacter: '-32702',
  ServerErrorInvalidXmlRpc: '-32600',
  ServerErrorRequestedMethodNotFound: '-32601',
  ServerErrorInvalidMethodParameters: '-32602',
  ServerErrorInternalXmlRpc: '-32603',
  ApplicationError: '-32500',
  SystemError: '-32400',
  TransportError: '-32300',
  '-32700': 'parse error. not well formed',
  '-32701': 'parse error. unsupported encoding',
  '-32702': 'parse error. invalid character for encoding',
  '-32600': 'server error. invalid xml-rpc. not conforming to spec.',
  '-32601': 'server error. requested method not found',
  '-32602': 'server error. invalid method parameters',
  '-32603': 'server error. internal xml-rpc error',
  '-32500': 'application error',
  '-32400': 'system error',
  '-32300': 'transport error',
};

module.exports = ReservedErrorCodes;
