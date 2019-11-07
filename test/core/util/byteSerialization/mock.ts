import { Transaction, TransactionType } from 'shared/model/transaction';
import { BlockModel } from 'shared/model/block';
import SlotService from 'core/service/slot';

export const recipientAddress = BigInt('15984232642719285606');
export const senderAddress = BigInt('4995063339468361088');
export const maxBigInt64 = BigInt('18446744073709551615');

/* tslint:disable:no-magic-numbers */

export const amount = 10000000000;

export const transactionRegister = new Transaction({
    id: '85519724a269996537c1c3533f912016c34b782678f96a0d1a35459b453611de',
    type: TransactionType.REGISTER,
    createdAt: SlotService.getTime(),
    senderPublicKey: '39790a5076f826d4583fa5aa9431c1e14f5ac0b3240274fa8a8478d94fe6a6df',
    senderAddress: recipientAddress,
    signature: '30151ea37990d405572428bc16510ae16b06614c9483c8a22c58456ac6d7fea3bb8e2a5e8c5ed0a5699a5aa630dafdfd' +
        '59919cc0b7a78c9e7b9392bbce0d100b',
    secondSignature: '',
    fee: 0,
    salt: '772c4c49eeef5df3240e1406c1283d51',
    relay: 1,
    confirmations: 0,
    asset: { referral: senderAddress }
});

export const transactionSend = new Transaction({
    id: '440b6c8433b9c9784121c4f4a3a990569be32ad51d4ff6192b0e72e151b5ce26',
    type: TransactionType.SEND,
    createdAt: SlotService.getTime(),
    senderPublicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
    senderAddress: senderAddress,
    signature: '6986fe85e0eb0236289274ec83defb81f4b3c5cf078bdeff29e3b8dfbc7670c7a56d3f3d4090d8b60c' +
        'b5b63fddbeb6452c32521488d908ce8f811979b401ef0a',
    secondSignature: '',
    fee: 1000000,
    salt: 'f74f89ef5eb66be0b8e069f854d2a7ec',
    relay: 2,
    confirmations: 0,
    asset: { recipientAddress: recipientAddress, amount: amount }
});

export const transactionDelegate = new Transaction({
    fee: 1000000000,
    relay: 2,
    confirmations: 0,
    senderAddress: BigInt('4074660263481057146'),
    id: 'd90db7322b6ee672e7a0efbec2c3f22a4a3e0680de7e0f57b0226e5f9886c0ff',
    type: TransactionType.DELEGATE,
    createdAt: SlotService.getTime(),
    senderPublicKey:
        'f0cecfea7cac6ec3f596172d78c771bdaf151a98d0cf92041f736f3a599b4a20',
    signature:
        '73970cb8268efcee1c37b7a54518963198ca291024d329d37aeeec66049196510d2ebc251864af897447b9db8e33a2f8dcd5fc' +
        '2206855e97a19fa357f659490a',
    secondSignature: '',
    salt: 'ab8d89385741ebe34abb4583e6f53b9c',
    asset: {
        username: 'mjuokeqdlrmrwkc'
    }
});

export const transactionStake = new Transaction({
        fee: 10000,
        relay: 2,
        confirmations: 0,
        senderAddress: 4074660263481057146n,
        id:
            '37b196c39f98aefff2f163131241ea8cf163ae6554ffa07de98293e7f7e315a2',
        type: TransactionType.STAKE,
        createdAt: SlotService.getTime(),
        senderPublicKey:
            'f0cecfea7cac6ec3f596172d78c771bdaf151a98d0cf92041f736f3a599b4a20',
        signature:
            '84c616a1dbe3bced61c7c8d863510bee526a29676ac24aa6a0726ccd7e8cb9935e20836b099d13450ef53fcf0fb80f93c59b73' +
            'a9ab8018957b47f998f839c403',
        secondSignature: '',
        salt: '43fc54b982af84a572b16a673ba7a899',
        asset:
            {
                amount: 100000000,
                startTime: 117563380,
                startVoteCount: 0,
                airdropReward: {
                    sponsors: new Map([
                        [maxBigInt64, 10000000]
                    ])
                }
            }
    }
);

export const transactionVote = new Transaction({
        fee: 10000,
        relay: 2,
        confirmations: 0,
        senderAddress: BigInt('4074660263481057146'),
        id: '0431253c29686a35f23336b225b290fc79530a323c6bb6c4d08c75eae3df362f',
        type: TransactionType.VOTE,
        createdAt: SlotService.getTime(),
        senderPublicKey:
            'f0cecfea7cac6ec3f596172d78c771bdaf151a98d0cf92041f736f3a599b4a20',
        signature:
            '99c5772fca4627ffa2cc9ae03e134f692634fe7b82dc5129dedc564dad1a48efc8ac3dbc345189587ee837fba05171d67499b' +
            'c1f01177f17a70feb794ca25f00',
        secondSignature: '',
        salt: 'af163bbba332da31711e01d65014040c',
        asset:
            {
                votes:
                    ['+137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a'],
                reward: 0,
                unstake: 0,
                airdropReward: {
                    sponsors: new Map([
                        [maxBigInt64, 30000000],
                        [maxBigInt64, 50000000]
                    ])
                }
            }
    }
);

export const transactionSignature = new Transaction({
        id: '6da4913a05572ffea59458344cfe917f539abe928443fa8fc839acd6b25bf05d',
        type: TransactionType.SIGNATURE,
        createdAt: SlotService.getTime(),
        senderPublicKey: '7ed7ea07e8e0037c20b5bff2dd2c3ef9365e7c61990f2e989aacd7787c64f30c',
        senderAddress: BigInt('1230911689556634841'),
        signature: '6317c23c2fc94c4aba5c4672e87bdeb766f24c572d06933d70e9efbe871ba10d006ee4a93eb8cf4823ecd58d8326' +
            '973ef8e8985946780d065fd69b777825120b',
        secondSignature: '',
        fee: 1000000,
        salt: 'd99bd2fcd59df0b7e914ada8c225ee10',
        relay: 2,
        confirmations: 0,
        asset: {
            publicKey: 'd10eb4aab374e564fcfdd7af533f935f8267638904a0375375110d8644db418f'
        }
    }
);

export const allTransactions = [
    transactionRegister,
    transactionSend,
    transactionSignature,
    transactionDelegate,
    transactionStake,
    transactionVote,
];

export const blockModel: BlockModel = new BlockModel({
    id: '99ad153e7ae44bdf3fda7656a7294f72dcccf7f1b6cc13e5f30f168091f2baca',
    version: 1,
    createdAt: SlotService.getTime(),
    height: 10,
    previousBlockId: '19707ec7e2f41d2cc75e73c95ae7bff800c9142ed199abfdd6b18a69e016935c',
    transactionCount: allTransactions.length,
    amount: 0,
    fee: 0,
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    generatorPublicKey: '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
    signature: '70bcca3bf410d66ab62408ee6833c9b5c74002084c91e447acd2730a1706d1fa37e2749d5949fcad39949a4550' +
        '38011e9f6480ca7203ec44cadf6b806715e80b',
    relay: 2,
    transactions: []
});

blockModel.transactions = allTransactions.map((transaction: Transaction<any>) => {
    const trs = new Transaction(transaction);
    delete(trs.relay);
    trs.blockId = '99ad153e7ae44bdf3fda7656a7294f72dcccf7f1b6cc13e5f30f168091f2baca';
    return trs;
});

export const blocks = [
    {...blockModel},
    {...blockModel},
    {...blockModel},
];
