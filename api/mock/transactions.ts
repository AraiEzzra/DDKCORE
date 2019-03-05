import {Address, PublicKey, Timestamp} from '../../shared/model/account';
import {TransactionStatus, TransactionType} from '../../shared/model/transaction';

export const mockTransactions = [
    {
        id: 'dc1c117fe069f475988e22383ff7b250f7a8b67ef223951b3687f7f622fc95f3',
        blockId: '3276517decd6171565151a3537e69c7e4f8d361050a4caf684dfcd796242757e',
        type: 10,
        senderPublicKey: '589884f47404ee0f0a46236f30e17cdc3d36501a1d03701a07140a526d3d79b0',
        senderAddress: '00000000000000000000',
        signature: '20f1dc029072e9769a579320c3ae6e32c6b7d9e60d211560348b0d6ae73b4a24a988221fe0a4e60acd26c4796cc9ee886621f57d2280aa8feaa8b6c296422707',
        createdAt: 0,
        fee: 0,
        status: null,
        salt: '0145b4f09dc2d5008beeed1f45423eb7',
        asset: {}
    },
    {
        id: 'dc1c117fe069f475988e22383ff7b250f7a8b67ef223951b3687f7f622fc95f3',
        blockId: '3276517decd6171565151a3537e69c7e4f8d361050a4caf684dfcd796242757e',
        type: 10,
        senderPublicKey: '589884f47404ee0f0a46236f30e17cdc3d36501a1d03701a07140a526d3d79b0',
        senderAddress: '00000000000000000000',
        signature: '20f1dc029072e9769a579320c3ae6e32c6b7d9e60d211560348b0d6ae73b4a24a988221fe0a4e60acd26c4796cc9ee886621f57d2280aa8feaa8b6c296422707',
        createdAt: 0,
        fee: 0,
        status: null,
        salt: '92607aa2a35c652a2d4548cb09048aba',
        asset: {}
    },
    {
        id: '1deeb122ed28661f9284960bce59db356b79fc69df104ce831fa00c26ad0d7da',
        blockId: 'ea813acbe1727ce845113affc120cd695685f0bec93993ae4a6a461e97938639',
        type: 10,
        senderPublicKey: 'a0515f134d80b7e89491e848fe1be340df297de6114acd6cbb82866c7c95252c',
        senderAddress: 15997339612254901283,
        signature: '20f1dc029072e9769a579320c3ae6e32c6b7d9e60d211560348b0d6ae73b4a24a988221fe0a4e60acd26c4796cc9ee886621f57d2280aa8feaa8b6c296422707',
        createdAt: 0,
        fee: 0,
        status: null,
        salt: '92607aa2a35c652a2d4548cb09048aba',
        asset: {}
    },
    {
        type: 30,
        amount: 0,
        fee: 0,
        createdAt: 0,
        recipientId: null,
        senderId: 'DDK15997339612254901283',
        senderPublicKey: 'a0515f134d80b7e89491e848fe1be340df297de6114acd6cbb82866c7c95252c',
        signature: '84f987179b3e9770c3042592412f6e99311b3866e371037eb2d0541716c79bd50158bb272cf31dc6de58660e12f2ca97dd0944bb0b1c018eb9e2ca81a6f0af05',
        id: '1deeb122ed28661f9284960bce59db356b79fc69df104ce831fa00c26ad0d7da',
        stakedAmount: 0,
        trsName: 'DELEGATE',
        salt: '7bb78433b9d6a3c779c1c021e9f66357',
        asset: {
            delegate: {
                username: 'TDALLIANCE1'
            }
        }
    },
    {
        type: 30,
        amount: 0,
        fee: 0,
        createdAt: 0,
        recipientId: null,
        senderId: 'DDK4618746982989879274',
        senderPublicKey: '059473307676a03ead0004339b4ec4f64383e7cec200ec2b686ccebba718b9f4',
        signature: '93d5edf347453b537e9022902057534b2a2f22a931e7c3087af87993f77f6ba73b4db1dedcdfca916a452cd74b1f1e28fa4085ead738e113785e9bcee5295805',
        id: 'd46db41a16cce87a01218fb8a65f275506b6b56c8b579a9d9c3888f4b131707d',
        stakedAmount: 0,
        trsName: 'DELEGATE',
        salt: '8d259ae9eb2678100108f580416737c5',
        asset: {
            delegate: {
                username: 'TDALLIANCE2'
            }
        }
    },
    {
        type: 60,
        amount: 0,
        fee: 0,
        createdAt: 0,
        recipientId: 'DDK4995063339468361088',
        senderId: 'DDK4995063339468361088',
        senderPublicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
        signature: '683c7755fc48baa2a7e1d91a967d41cbb0b4386b5a6a97b8818c88d9ca21d726ff17c0282c6f5d3784cf9f2985d5f5e39e334b3c12cd7e0ac222c57f841b1b0c',
        id: '85d00bf7d22a253e4672c06cada8a1cb94bc7527b959660c91a85919e5717fde',
        stakedAmount: 0,
        trsName: 'VOTE',
        salt: 'b474a656fc2c326fb43d5e8e3fe36307',
        asset: {
            votes: [
                '+a0515f134d80b7e89491e848fe1be340df297de6114acd6cbb82866c7c95252c',
                '+059473307676a03ead0004339b4ec4f64383e7cec200ec2b686ccebba718b9f4',
                '+bd27a7c1c4d4c62bbe0a5fe292e7c3f201d55db9ef1d4c4013cde0a679f55b51'
            ]
        }
    },
    {
        type: 60,
        amount: 0,
        fee: 0,
        createdAt: 0,
        recipientId: 'DDK573794630550253062',
        senderId: 'DDK573794630550253062',
        senderPublicKey: 'eb3ecfad0b81f6744a0c9152e3b2baabdb6a4c795cfc2fbf94caf9276bbf1cb7',
        signature: '94032dd3644b039386f7b341622142264d2515645c66244738981b1318dfc4654fe9ccee54cdaef661a489b17494ef2984b274c4a27e4776f97f5273f92b1406',
        id: '9db32306db544303a4702da927c2d9d05af4fd02c1b4ed0192e16d1f1cb38517',
        stakedAmount: 0,
        trsName: 'VOTE',
        salt: '08569b61a1b4010fdfbf36fc40925728',
        asset: {
            votes: [
                '+eb3ecfad0b81f6744a0c9152e3b2baabdb6a4c795cfc2fbf94caf9276bbf1cb7',
                '+6fafb15bf9e9bff361f144ff2dc22743151e0fc404e7a257017220dcb09c31a3',
                '+3d59755c247abce2d9ea55bc85764563c1880cc057c0b4c1e6805647ea05f0c8'
            ]
        }
    },
];

