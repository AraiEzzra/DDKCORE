import { BufferTypes } from 'shared/util/byteSerializer/types';
import { schemaStore } from 'shared/util/byteSerializer/schema';

export enum SchemaName {
    Request = 0,
    ShortPeerInfo = 1,
    Headers = 2,
    FullHeaders = 3,
    BlockData = 4,
    Block = 5,
    OldTransaction = 6,
    OldTransactionBlock = 7,
    OldTransactionAssetRegister = 8,
    OldTransactionAssetSend = 9,
    TransactionAssetSignature = 10,
    TransactionAssetDelegate = 11,
    OldTransactionAssetStake = 12,
    OldTransactionAssetVote = 13,
    OldAirdropReward = 14,
    CommonBlockResponse = 15,
    RequestBlocks = 16,
    Empty = 17,
    Transaction = 18,
    TransactionBlock = 19,
    TransactionAssetRegister = 20,
    TransactionAssetSend = 21,
    TransactionAssetStake = 22,
    TransactionAssetVote = 23,
    AirdropReward = 24,
}

schemaStore.add(SchemaName.Request, {
    code: new BufferTypes.Utf8(),
    data: new BufferTypes.Buffer(),
});

schemaStore.add(SchemaName.ShortPeerInfo, {
    // TODO can be stored in 4 byte in far future
    ip: new BufferTypes.Utf8(),
    port: new BufferTypes.Uint16(),
    peerCount: new BufferTypes.Uint16(),
});


schemaStore.add(SchemaName.Headers, {
    height: new BufferTypes.Uint32(),
    broadhash: new BufferTypes.Utf8(),
    peerCount: new BufferTypes.Uint16()
});

schemaStore.add(SchemaName.FullHeaders, {
    height: new BufferTypes.Uint32(),
    broadhash: new BufferTypes.Utf8(),
    blocksIds: new BufferTypes.Map(new BufferTypes.Uint32(), new BufferTypes.Utf8()),
    os: new BufferTypes.Utf8(),
    // TODO can be stored in 3 byte in far future
    version: new BufferTypes.Utf8(),
    // TODO can be stored in 3 byte in far future
    minVersion: new BufferTypes.Utf8(),
    peerCount: new BufferTypes.Uint16(),
});

schemaStore.add(SchemaName.BlockData, {
    height: new BufferTypes.Uint32(),
    id: new BufferTypes.Utf8(),
});

schemaStore.add(SchemaName.Block, {
    height: new BufferTypes.Uint32(),
    id: new BufferTypes.Utf8(),
    version: new BufferTypes.Uint8(),
    createdAt: new BufferTypes.Uint32(),
    previousBlockId: new BufferTypes.Utf8(),
    transactionCount: new BufferTypes.Uint16(),
    amount: new BufferTypes.Number64(),
    fee: new BufferTypes.Number64(),
    payloadHash: new BufferTypes.Utf8(),
    generatorPublicKey: new BufferTypes.Utf8(),
    signature: new BufferTypes.Utf8(),
    relay: new BufferTypes.Uint8(),
    transactions: new BufferTypes.Buffer(),
});

// TODO destroy after full migration
schemaStore.add(SchemaName.OldTransaction, {
    id: new BufferTypes.Utf8(),
    type: new BufferTypes.Uint8(),
    createdAt: new BufferTypes.Uint32(),
    senderPublicKey: new BufferTypes.Utf8(),
    senderAddress: new BufferTypes.Uint64(),
    signature: new BufferTypes.Utf8(),
    secondSignature: new BufferTypes.Utf8(),
    fee: new BufferTypes.Number64(),
    salt: new BufferTypes.Utf8(),
    relay: new BufferTypes.Uint8(),
    confirmations: new BufferTypes.Uint32(),
    asset: new BufferTypes.Buffer()
});

schemaStore.add(SchemaName.OldTransactionBlock, {
    id: new BufferTypes.Utf8(),
    blockId: new BufferTypes.Utf8(),
    type: new BufferTypes.Uint8(),
    createdAt: new BufferTypes.Uint32(),
    senderPublicKey: new BufferTypes.Utf8(),
    senderAddress: new BufferTypes.Uint64(),
    signature: new BufferTypes.Utf8(),
    secondSignature: new BufferTypes.Utf8(),
    fee: new BufferTypes.Number64(),
    salt: new BufferTypes.Utf8(),
    confirmations: new BufferTypes.Uint32(),
    asset: new BufferTypes.Buffer(),
});

schemaStore.add(SchemaName.OldTransactionAssetRegister, {
    referral: new BufferTypes.Uint64()
});

schemaStore.add(SchemaName.OldTransactionAssetSend, {
    recipientAddress: new BufferTypes.Uint64(),
    amount: new BufferTypes.Number64()
});

schemaStore.add(SchemaName.TransactionAssetSignature, {
    publicKey: new BufferTypes.Utf8(),
});

schemaStore.add(SchemaName.TransactionAssetDelegate, {
    username: new BufferTypes.Utf8()
});

schemaStore.add(SchemaName.OldTransactionAssetStake, {
    amount: new BufferTypes.Number64(),
    startTime: new BufferTypes.Uint32(),
    startVoteCount: new BufferTypes.Uint8(),
    airdropReward: new BufferTypes.Object(SchemaName.OldAirdropReward)
});

schemaStore.add(SchemaName.OldTransactionAssetVote, {
    votes: new BufferTypes.Array(new BufferTypes.Utf8()),
    reward: new BufferTypes.Number64(),
    unstake: new BufferTypes.Number64(),
    airdropReward: new BufferTypes.Object(SchemaName.OldAirdropReward)
});

schemaStore.add(SchemaName.OldAirdropReward, {
    sponsors: new BufferTypes.Map(new BufferTypes.Uint64(), new BufferTypes.Number64())
});

schemaStore.add(SchemaName.CommonBlockResponse, {
    isExist: new BufferTypes.Boolean()
});

schemaStore.add(SchemaName.RequestBlocks, {
    height: new BufferTypes.Uint32(),
    limit: new BufferTypes.Uint8()
});

schemaStore.add(SchemaName.Empty, {});



schemaStore.add(SchemaName.Transaction, {
    id: new BufferTypes.Utf8(),
    type: new BufferTypes.Uint8(),
    createdAt: new BufferTypes.Uint32(),
    senderPublicKey: new BufferTypes.Utf8(),
    senderAddress: new BufferTypes.Uint128(),
    signature: new BufferTypes.Utf8(),
    secondSignature: new BufferTypes.Utf8(),
    fee: new BufferTypes.Number64(),
    salt: new BufferTypes.Utf8(),
    relay: new BufferTypes.Uint8(),
    confirmations: new BufferTypes.Uint32(),
    asset: new BufferTypes.Buffer()
});

schemaStore.add(SchemaName.TransactionBlock, {
    id: new BufferTypes.Utf8(),
    blockId: new BufferTypes.Utf8(),
    type: new BufferTypes.Uint8(),
    createdAt: new BufferTypes.Uint32(),
    senderPublicKey: new BufferTypes.Utf8(),
    senderAddress: new BufferTypes.Uint128(),
    signature: new BufferTypes.Utf8(),
    secondSignature: new BufferTypes.Utf8(),
    fee: new BufferTypes.Number64(),
    salt: new BufferTypes.Utf8(),
    confirmations: new BufferTypes.Uint32(),
    asset: new BufferTypes.Buffer(),
});

schemaStore.add(SchemaName.TransactionAssetRegister, {
    referral: new BufferTypes.Uint128()
});

schemaStore.add(SchemaName.TransactionAssetSend, {
    recipientAddress: new BufferTypes.Uint128(),
    amount: new BufferTypes.Number64()
});

schemaStore.add(SchemaName.AirdropReward, {
    sponsors: new BufferTypes.Map(new BufferTypes.Uint128(), new BufferTypes.Number64())
});

schemaStore.add(SchemaName.TransactionAssetStake, {
    amount: new BufferTypes.Number64(),
    startTime: new BufferTypes.Uint32(),
    startVoteCount: new BufferTypes.Uint8(),
    airdropReward: new BufferTypes.Object(SchemaName.AirdropReward)
});

schemaStore.add(SchemaName.TransactionAssetVote, {
    votes: new BufferTypes.Array(new BufferTypes.Utf8()),
    reward: new BufferTypes.Number64(),
    unstake: new BufferTypes.Number64(),
    airdropReward: new BufferTypes.Object(SchemaName.AirdropReward)
});
