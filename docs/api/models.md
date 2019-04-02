# Models

## Account

| Parameter       | Type    | Description       |
|-----------------|---------|-------------------|
| address         | string  | Address           |
| publicKey       | string  | Public key        |
| secondPublicKey | string  | Second public key |
| actualBalance   | number  | Balance           |
| isDelegate      | boolean | Delegate flag     |
| votes           | number  | Votes             |
| referrals       | number  | Referrals         |
| stakes          | number  | Stackes           |

## Transaction Types

| Name      | Value |
|-----------|-------|
| REGISTER  | 0     |
| SEND      | 10    |
| SIGNATURE | 20    |
| DELEGATE  | 30    |
| STAKE     | 40    |
| SENDSTAKE | 50    |
| VOTE      | 60    |

## Transaction

| Parameter       | Type              | Description                       |
|-----------------|-------------------|-----------------------------------|
| id              | string            | Address                           |
| blockId         | string            | Block id                          |
| type            | [TransactionType] | Type                              |
| createdAt       | number            | Creation time in epochtime format |
| senderPublicKey | string            | Sender public key                 |
| senderAddress   | string            | Sender address                    |
| signature       | string            | Signature                         |
| secondSignature | string            | Second signature                  |
| salt            | string            | Salt                              |
| relay           | number            | Transfer count                    |
| asset           | [Asset]           | Asset by type                     |

## Block

| Parameter          | Type               | Description                          |
|--------------------|--------------------|--------------------------------------|
| id                 | string             | Id                                   |
| version            | number             | Version                              |
| createdAt          | number             | Creation time in epochtime format    |
| height             | number             | Height                               |
| previousBlockId    | string             | Previous block id                    |
| transactionCount   | number             | Transaction count                    |
| amount             | number             | Amount                               |
| fee                | number             | Fee                                  |
| payloadHash        | string             | Transactions hash                    |
| generatorPublicKey | string             | Delegate public key who signed block |
| signature          | string             | Signature                            |
| transactions       | Array[Transaction] | Array of transactions                |

## Reward

| Parameter     | Type              | Description                       |
|---------------|-------------------|-----------------------------------|
| transactionId | string            | Id                                |
| type          | [TransactionType] | Version                           |
| createdAt     | number            | Creation time in epochtime format |
| sponsor       | string            | Sponsor address                   |
| referral      | string            | Referral address                  |
| referralLevel | number            | Referral level                    |
| amount        | number            | Amount                            |

## Referral Rewards

| Parameter | Type   | Description      |
|-----------|--------|------------------|
| referral  | string | Referral address |
| amount    | number | Amount           |

## Stake Reward

| Parameter       | Type                   | Description                       |
|-----------------|------------------------|-----------------------------------|
| transactionId   | string                 | Unique identifier                 |
| createdAt       | number                 | Creation time in epochtime format |
| referralRewards | Array[ReferralRewards] | Referral rewards                  |
| amount          | number                 | Amount                            |

## Delegate

| Parameter    | Type   | Description                           |
|--------------|--------|---------------------------------------|
| username     | string | Unique username                       |
| missedBlocks | number | Number of blocks that were not forged |
| forgedBlocks | number | Number of blocks that were forged     |
| publicKey    | string | Public key                            |
| votes        | number | Number of votes for the delegate      |
