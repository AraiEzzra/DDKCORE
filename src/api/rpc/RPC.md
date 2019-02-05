

## `GET_STATUS`
Returns all current status data of the node, e.g. height and broadhash.

#### Parameters

- No parameters

#### Response
```
"result": {
    "broadhash": "aa075d4277135b18b3d6f89c3b2b18a5e8a9054880668c2d2f767c354b89542b",
    "epoch": "2016-01-01T17:00:00.000Z",
    "height": 307384,
    "fee": 0.01,
    "milestone": 0,
    "nethash": "062439070c3134dc3798ca315779071820206b892571395a17bfdc1ade748112",
    "reward": 0,
    "supply": 4652612500000000
}
```



## `GET_ACCOUNT`
*Attention: required property - address or publicKey*
Search for matching account in the system.

#### Parameters

- address             string              Address of an account
- publicKey           string              Public key to query

#### Response
```
"result": {
    "account": {
        "address": "DDK000000000000000000",
        "unconfirmedBalance": "0",
        "balance": "0",
        "publicKey": "00000000000000000000000000000000000000000000000000000000000000000,
        "unconfirmedSignature": 0,
        "secondSignature": 0,
        "secondPublicKey": null,
        "multisignatures": [],
        "u_multisignatures": [],
        "totalFrozeAmount": "0"
    }
}
```



## `GET_BALANCE`
Return the account balance by address

#### Parameters

- address             string              Address of an account

#### Response
```
"result": {
    "balance": "0",
    "unconfirmedBalance": "0"
}
```



## `GET_BLOCK`
Search for a specified block in the system.

#### Parameters

- id                  string              Block id to query

#### Response
```
"result": {
    "block": {
        "id": "e7c68f982c75193a740e916dd3e36604afb842e1a23169f8c8662ef50dae06a0",
        "version": 1,
        "timestamp": 97100000,
        "height": 307384,
        "previousBlock": "4af8c8f114069028cb94e3c54620730d85bfaa228a499639c9b9b3dbbafa1ff5",
        "numberOfTransactions": 0,
        "totalAmount": 0,
        "totalFee": 0,
        "reward": 0,
        "payloadLength": 0,
        "payloadHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "generatorPublicKey": "137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a",
        "generatorId": "DDK0000000000000000000",
        "blockSignature": "6a38cd686f402e5bc435aa2f62c8f240b003c57adbfb76833c9b9fa274694a4d0eb1234848e91bbbc5ad9b751b910ad3bf00f1653d47451126e5615451c6a007",
        "confirmations": 9,
        "username": "UserName",
        "totalForged": "0"
    }
}
```



## `GET_BLOCKS_COUNT`
Return blocks count

#### Parameters

No parameters

#### Response
```
"result": {
    "count": "307384"
}
```




## `GET_BLOCKS`
Search for a specified block in the system.

#### Parameters

- blockId                  string                   Block id to query
- height                   number                   Current height of the network
- limit                    number                   Limit applied to results (Default value : 10)  
- offset                   number                   Offset value for results (Default value : 0)
- generatorPublicKey       string                   Public key of the forger of the block
- sort                     string                   Fields to sort results by (Available values : height:asc, height:desc, totalAmount:asc, totalAmount:desc, totalFee:asc, totalFee:desc, timestamp:asc, timestamp:desc) (Default value : height:desc)

#### Response
```
"result": {
    "blocks": [
    {
        "id": "e7c68f982c75193a740e916dd3e36604afb842e1a23169f8c8662ef50dae06a0",
        "version": 1,
        "timestamp": 97100000,
        "height": 307384,
        "previousBlock": "4af8c8f114069028cb94e3c54620730d85bfaa228a499639c9b9b3dbbafa1ff5",
        "numberOfTransactions": 0,
        "totalAmount": 0,
        "totalFee": 0,
        "reward": 0,
        "payloadLength": 0,
        "payloadHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "generatorPublicKey": "137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a",
        "generatorId": "DDK7897332094363173555",
        "blockSignature": "6a38cd686f402e5bc435aa2f62c8f240b003c57adbfb76833c9b9fa274694a4d0eb1234848e91bbbc5ad9b751b910ad3bf00f1653d47451126e5615451c6a007",
        "confirmations": 1,
        "username": "UserName",
        "totalForged": "0"
    },
    {}...
```




## `GET_BROADHASH`

#### Parameters

No parameters

#### Response
```
"result": {
    "broadhash": "ac39e60cc934bef3860e365c4c1c460810f851e89ba1fc4991201a9353cc79d4"
}
```




## `GET_DELEGATE`
*Attention: publicKey or username is required*

#### Parameters

- publicKey               string                    Public key to query
- username                string                    Delegate username to query

#### Response
```
"result": {
    "delegate": {
        "username": "DelegateName",
        "address": "DDK000000000000000000000",
        "publicKey": "137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a",
        "vote": "0",
        "missedblocks": 0,
        "producedblocks": 307384,
        "url": null,
        "rate": 1,
        "rank": 1,
        "approval": 100,
        "productivity": 100
    }
}
```




## `GET_DELEGATES`
Search for a specified delegate in the system.

#### Parameters

- address                 string                    Address of an account
- publicKey               string                    Public key to query
- secondPublicKey         string                    Second public key to query
- username                string                    Delegate username to query
- offset                  number                    Offset value for results (Default value : 0)
- limit                   number                    Limit applied to results (Default value : 10)
- search                  string                    Fuzzy delegate username to query
- sort                    string                    Fields to sort results by (Available values : username:asc, username:desc, rank:asc, rank:desc, productivity:asc, productivity:desc, missedBlocks:asc, missedBlocks:desc, producedBlocks:asc, producedBlocks:desc) (Default value : rank:asc)

#### Response
```
"result": {
    "delegates": [
    {
        "username": "DelegateName",
        "address": "DDK7897332094363171058",
        "publicKey": "137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a",
        "vote": "0",
        "missedblocks": 0,
        "producedblocks": 307384,
        "url": null,
        "rate": 1,
        "rank": 1,
        "approval": 100,
        "productivity": 100
    },
    {}...
```



## `GET_EPOCH`


#### Parameters

No parameters

#### Response
```
"result": {
    "epoch": "2016-01-01T17:00:00.000Z"
}
```



## `GET_FEE`

#### Parameters

No parameters

#### Response
```
"result": {
    "fee": 0.01
}
```



## `GET_FEES`

#### Parameters

No parameters

#### Response
```
"result": {
    "fees": {
        "send": 0.01,
        "vote": 0.01,
        "secondsignature": 1000000,
        "delegate": 1000000000,
        "multisignature": 1000000,
        "dapp": 2500000000,
        "froze": 0.01,
        "sendfreeze": 0.1,
        "reward": 0
    }
}
```


## `GET_FORGED_BY_ACCOUNT`

#### Parameters

- generatorPublicKey            string          Public key

#### Response
```
"result": {
    "fees": "0",
    "rewards": "0",
    "forged": "0"
}
```


## `GET_FORGING_STATUS`

#### Parameters

- 

#### Response
```

```


## `GET_HEIGHT`

#### Parameters

No parameters

#### Response
```
"result": {
    "height": 307384
}
```


## `GET_MILESTONE`

#### Parameters

No parameters

#### Response
```
"result": {
    "milestone": 0
}
```


## `GET_NETHASH`

#### Parameters

No parameters

#### Response
```
"result": {
    "nethash": "82c2a4fddcd1f659ba60380ebdd38125c5c48ceeef7d8b9f5798c0faca89e808"
}
```


## `GET_NEXT_FORGERS`

#### Parameters

No parameters

#### Response
```
"result": {
    "currentBlock": 307384,
    "currentBlockSlot": 9710109,
    "currentSlot": 9710111,
    "delegates": [
        "137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a",
        "276f0d09e64b68566fb458b7c71aeb62411d0b633ad6c038e5a4a042ec588af9",
        "3f0348b6d3ecaeaeca0a05ee4c2d7b4b7895ef0a12d8023ba245b6b8022833e5"
    ]
}
```


## `GET_PEER`

#### Parameters

-

#### Response
```

```


## `GET_PEERS`
Search for specified peers.

#### Parameters

- ip                        string           IP of the node or delegate
- httpPort                  number           Http port of the node or delegate
- wsPort                    number           Web socket port for the node or delegate
- os                        string           OS of the node
- version                   string           Lisk version of the node
- state                     number           Current state of the network
- height                    number           Current height of the network
- broadhash                 string           Broadhash of the network
- limit                     number           Limit applied to results (Default value : 10)
- offset                    number           Offset value for results (Default value : 0)
- sort                      string           Fields to sort results by (Available values : height:asc, height:desc, version:asc, version:desc) (Default value : height:desc)

#### Response
```
"result": {
    "peers": [
    {
        "ip": "10.7.0.5",
        "port": 7007,
        "state": 2,
        "os": "linux4.8.0-53-generic",
        "version": "0.9.9a",
        "dappid": null,
        "broadhash": "b6767bd0cd02a5978a6622c5b2bd7e0342dc1a5d59bbd0de15ff4cde70c66728",
        "height": 138,
        "clock": null,
        "updated": 1548768818440,
        "nonce": "VXSx3biSmhRAgk20"
    },
    {}...
}
```



## `GET_PUBLICKEY`

#### Parameters

- address                   string           Address of an account

#### Response
```
"result": {
    "publicKey": "e72ffcb50310a68f14a7565116a1a0d8641c89906e583cb3735cc1b70c915605"
}
```

## `GET_REWARD`

#### Parameters

-

#### Response
```
"result": {
    "reward": 0
}
```




## `GET_SUPPLY`

#### Parameters

No parameters

#### Response
```
"result": {
    "supply": 4500000000000000
}
```



## `GET_TRANSACTION`
Search transaction by id in the system.

#### Parameters

- id*                     string            Transaction id to query

#### Response
```
"result": {
    "transaction": [
    {
        "id": "951b368c1c117fe069f47597f7f622fd88e22383ff7b250f7a8b67ef223c95f3",
        "height": 1,
        "blockId": "6027353f37242fd17f2b6b2adb19615b530056cdf238ed5909cf7cd38633b45a",
        "type": 10,
        "timestamp": 0,
        "senderPublicKey": "589884f4743701a07140a504ee0f0a46236f30e17cdc3d36501a1d026d3d79b0",
        "requesterPublicKey": null,
        "senderId": "DDK00000000000000000000",
        "recipientId": "DDK4995063339468361088",
        "recipientPublicKey": null,
        "amount": 4500000000000000,
        "stakedAmount": 0,
        "stakeId": null,
        "groupBonus": 0,
        "fee": 0,
        "signature": "20f1dcd211560348b0d6ae73b4a24a988221fe0a4e60acd26c4796c029072e9769a579320c3ae6e32c6b7d9e60c9ee886621f57d2280aa8feaa8b6c296422707",
        "signSignature": null,
        "signatures": [],
        "confirmations": null,
        "asset": {},
        "trsName": "SEND",
        "reward": null,
        "pendingGroupBonus": null,
        "salt": "0145b4f09dc2d5008beeed1f45423eb7",
        "recipientName": "UserName"
    },
    {}...
}
```



## `GET_TRANSACTIONS`
Search for a specified transaction in the system.

#### Parameters

- id                       string           Transaction id to query
- recipientId              string           Recipient lisk address
- recipientPublicKey       string           Recipient public key 
- senderId                 string           Sender lisk address
- senderPublicKey          string           Sender public key
- senderIdOrRecipientId    string           Lisk address
- type                     number           Transaction type (0-7)
- height                   number           Current height of the network
- minAmount                number           Minimum transaction amount in Beddows
- maxAmount                number           Maximum transaction amount in Beddows
- fromTimestamp            number           Starting unix timestamp
- toTimestamp              number           Ending unix timestamp
- blockId                  string           Block id to query
- limit                    number           Limit applied to results (Default value : 10)
- offset                   number           Offset value for results (Default value : 0)
- sort                     string           Fields to sort results by (Available values : amount:asc, amount:desc, fee:asc, fee:desc, type:asc, type:desc, timestamp:asc, timestamp:desc) (Default value : amount:asc)

#### Response
```
"result": {
    "transactions": [
    {
        "id": "b34a918a5e34cffc517489769a617293ee5d0f28192c3179f55ceb4eb4bebdbc",
        "height": 1,
        "blockId": "60273242f238ed5909cf7cd337fd17f2b6b2adb19615b530053f56cd8633b45a",
        "type": 30,
        "timestamp": 0,
        "senderPublicKey": "df4b6a215a8d1f5c4231b2b554d41338c75dda177b9586c1e84906f0b8241f30",
        "requesterPublicKey": null,
        "senderId": "DDK00000000000000000000000",
        "recipientId": null,
        "recipientPublicKey": null,
        "amount": 0,
        "stakedAmount": 0,
        "stakeId": null,
        "groupBonus": 0,
        "fee": 0,
        "signature": "e3905fe740f5cf0da636d7210f01cfe68f736095299e0124e0f3c067c29987a4490fc556c5e88cb98b436e035b3d8a79d118fd46e80fc5e004b543e192b68b09",
        "signSignature": null,
        "signatures": [],
        "confirmations": null,
        "asset": {},
        "trsName": "DELEGATE",
        "reward": null,
        "pendingGroupBonus": null,
        "salt": "e8c967ec2a5297a9e94eecf5fc139249",
        "senderName": "UserName"
    },
    {}...
}
```


## `GET_VOTERS`
*Attention: At least one of the filter parameters must be provided.*
Returns all votes received by a delegate.

#### Parameters

- username                 string           Delegate username to query
- address                  string           Address of an account
- publicKey                string           Public key to query
- secondPublicKey          string           Second public key to query
- offset                   number           Offset value for results (Default value : 0)
- limit                    number           Limit applied to results (Default value : 10)
- sort                     string           Fields to sort results by (Available values : publicKey:asc, publicKey:desc, balance:asc, balance:desc, username:asc, username:desc) )(Default value : publicKey:asc)

#### Response
```
"result": {
    "voters": [
        {
            "address": "DDK0000000000000000000",
            "balance": "0",
            "publicKey": "83cb3d82ffcb6e73735ccf14a71051b70c915606515a68641c8e1699050a1a05"
        }
    ],
    "count": {
        "count": "1"
    }
}
```



## `GENERATE_PUBLICKEY`
Generate public key 

#### Parameters

- secret            string              Format BIP39

#### Response
```
"result": {
    "publicKey": "f68d7acf7be358a5db259d371200e64ce8d611c1fa089ad2030b177e2b21d798"
}
```



## `OPEN_ACCOUNT` 
Created new account with address

#### Parameters

- secret                  string          hex
- email                   string          username

#### Response
```
"result": {
    "account": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5c.......fs_QIA2usVmFCsp66e3ePlldPU"
    }
}
```



## `TRANSACTION_SEND`
Send transaction with transfer amount

#### Parameters
- secret                  string
- amount                  number
- recipientId             string


#### Response
```
"result": {
    "transactionId": "1a03b36fbd6a21e1a4c9b1809e56cf28ad43f9b368211d12974256c6f37b5fc5"
}
```



## `TRANSACTION_STAKE` 
Send transaction with stake amount

#### Parameters
- secret                  string
- freezedAmount           number

#### Response
```
"result": {
    "transaction": {
        "type": 40,
        "amount": 0,
        "senderPublicKey": "9a4ae9182c939e47ad33f01aa1a4ceaf75ecc8b90c971fd5a6e2dbf919c5fbe1",
        "requesterPublicKey": null,
        "timestamp": 97102371,
        "asset": {
            "stakeOrder": {
            "stakedAmount": 1,
            "nextVoteMilestone": 97102371,
            "startTime": 97102371
        },
        "airdropReward": {
            "withAirdropReward": false,
            "sponsors": {},
            "totalReward": 0
        }
        },
        "stakedAmount": 1,
        "trsName": "STAKE",
        "groupBonus": 0,
        "salt": "c64d35fb40b466cdd67cf206cafc1227",
        "reward": null,
        "recipientId": null,
        "signature": "2e79a8274e0a67c899c0b296c3916c96e6f2ae22d40f294fb2cd89762a6edb71f280d8a37d3c920fda63f39e6db35b599870bb3cc38eb6b82ffa20894cfba607",
        "id": "2eb8bc7ab982720b8b0e677840405d340988cfdc251ff5d8055a2a344079a825",
        "fee": 0.0001,
        "status": 1
    },
    "referStatus": true
}
```
