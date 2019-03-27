import {TransactionType} from 'shared/model/transaction';
import {getRequestHeader} from 'test/core/transaction-lifecycle/headerBuilder';

const VOTE = (sender, votes = []) => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.VOTE,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        votes: votes
                    }
                },
                secret: sender.privateKey
            }
        }
    };
};

const SEND = (sender, amount = 0, recepeintAddress = '') => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.SEND,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        amount: 110000000,
                        recipientAddress: '18045271674987759523',
                    }
                },
                secret: sender.privateKey
            }
        }
    };
};

const DELEGATE = (sender, username = '') => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.DELEGATE,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        username: 'delegatetest',
                    }
                },
                secret: sender.privateKey
            }
        }
    };
};

const SIGNATURE = (sender, secret = '') => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.SIGNATURE,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        publicKey: 'bfeaf852febd1523464146a6d5ec153a902047316666e5f4bbee41b8982c9801',
                    }
                },
                secret: sender.privateKey,
                secondSecret: 'bread venture tape toast pause label initial jacket panther lizard problem shove'
            }
        }
    };
};

const REGISTER = (sender, referral = '') => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.REGISTER,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        referral: '7897332094363171058',
                    }
                },
                secret: sender.privateKey
            }
        }
    };
};

const STAKE = (sender, amount = 0, startVoteCount = 0) => {
    return {
        headers: getRequestHeader(),
        code: 'CREATE_TRANSACTION',
        body: {
            data: {
                trs: {
                    type: TransactionType.STAKE,
                    senderPublicKey: sender.publicKey,
                    asset: {
                        amount: 110000000,
                        startVoteCount: 3,
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
