const ReservedError = {
    ParseErrorNotWellFormed: 'Error code: -32700; Parse error. Not well formed',
    ParseErrorUnsupportedEncoding: 'Error code: -32701; Parse error. Unsupported encoding',
    ParseErrorInvalidCharacter: 'Error code: -32702; Parse error. Invalid character for encoding',
    ServerErrorInvalidXmlRpc: 'Error code: -32600; Server error. Invalid xml-rpc. not conforming to spec.',
    ServerErrorRequestedMethodNotFound: 'Error code: -32601; Server error. Requested method not found',
    ServerErrorInvalidMethodParameters: 'Error code: -32602; Server error. Invalid method parameters',
    ServerErrorInternalXmlRpc: 'Error code: -32603; Server error. Internal xml-rpc error',
    ApplicationError: 'Error code: -32500; Application error',
    SystemError: 'Error code: -32400; System error',
    TransportError: 'Error code: -32300; Transport error',
    NoDetermined: 'Error not determined',
};

module.exports = ReservedError;
