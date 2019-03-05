import {IAsset, Transaction, TransactionStatus, TransactionType} from 'shared/model/transaction';

export const generateTrs = (): Array<Transaction<IAsset>> => {
    const trs: Array<Transaction<IAsset>> = [];
    for (let i = 0; i < 8; i++) {
        trs.push(generateTransaction(i));
    }
    return trs;
};

const generateTransaction = (index: number) => {
    return new Transaction({
        id: '9db32306db544303a4702da927c2d9d05af4fd02c1b4ed0192e16d1f1cb3851' + index,
        blockId: '3276517decd6171565151a3537e69c7e4f8d361050a4caf684dfcd796242757' + index,
        type: TransactionType.VOTE,
        senderPublicKey: 'eb3ecfad0b81f6744a0c9152e3b2baabdb6a4c795cfc2fbf94caf9276bbf1cb7',
        senderAddress: 573794630550253062,
        signature: '94032dd3644b039386f7b341622142264d2515645c66244738981b1318dfc4654fe9ccee54cdaef661a489b17494e' +
            'f2984b274c4a27e4776f97f5273f92b1406',
        createdAt: Date.now() / 100,
        fee: 0,
        status: TransactionStatus.CREATED,
        salt: '08569b61a1b4010fdfbf36fc40925728',
        secondSignature: null,
        asset: {
            votes: [
                '+eb3ecfad0b81f6744a0c9152e3b2baabdb6a4c795cfc2fbf94caf9276bbf1cb7',
                '+6fafb15bf9e9bff361f144ff2dc22743151e0fc404e7a257017220dcb09c31a3',
                '+3d59755c247abce2d9ea55bc85764563c1880cc057c0b4c1e6805647ea05f0c8'
            ]
        }
    });
};

