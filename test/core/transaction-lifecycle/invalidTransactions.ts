import {TransactionType} from 'shared/model/transaction';
import {getRequestHeader} from 'test/core/transaction-lifecycle/headerBuilder';

const VOTE = (sender) => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.VOTE,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        votes: 'wrongType'
                    }
                },
                secret: sender.privateKey
            }
        }
    };
};

const SEND = (sender) => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.SEND,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        amount: -100,
                        recipientAddress: '',
                    }
                },
                secret: sender.privateKey
            }
        }
    };
};

const DELEGATE = (sender) => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.DELEGATE,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        username: 'usernameshouldntbelongerthan20chars',
                    }
                },
                secret: sender.privateKey
            }
        }
    };
};

const SIGNATURE = (sender) => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.SIGNATURE,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        publicKey: sender.publicKey,
                    }
                },
                secret: sender.privateKey,
                secondSecret: 100
            }
        }
    };
};

const REGISTER = (sender) => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.REGISTER,
                    senderPublicKey: sender.publicKey,
                    asset: {}
                },
                secret: sender.privateKey
            }
        }
    };
};

const STAKE = (sender) => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.STAKE,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        amount: -100,
                        startVoteCount: -1,
                    }
                },
                secret: sender.privateKey
            }
        }
    };
};

export default {
    VOTE,
    SEND,
    DELEGATE,
    SIGNATURE,
    STAKE,
    REGISTER
};
