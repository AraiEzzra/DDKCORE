# EVENTS

## APPLY BLOCK

Sends just applied block to all socket clients.

Code: `APPLY_BLOCK`

Event body contains a [Block](models.md#block).

### APPLY BLOCK EXAMPLES

Event

```json
{
    "code":"APPLY_BLOCK",
    "headers":{
        "id":"6d51c66f-6d4f-4fb4-9e4d-99b250411bf6",
        "type":3
    },
    "body":{
        "id":"79c8a281ce1c73549fca74fa528a8816619bd22a12e33f43c61a7f438a318d6c",
        "version":1,
        "height":893,
        "transactionCount":0,
        "amount":0,
        "fee":0,
        "payloadHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "generatorPublicKey":"83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05",
        "signature":"7e8868db530300d53a7bbd1db71f5b89f4c98a2f35cccc100a880843b63fbb5e4879a642ee2f43ef751c29af49cd471c10de16238e6e91bb7e27c785bbc93a06",
        "relay":2,
        "createdAt":102711510,
        "previousBlockId":"4127b7cbfc9753c67beb9637d2af2ec46e650b51bb53b0ba90f525084ac87bc3"
    }
}
```

## UNDO BLOCK

Sends just rolled back a block to all socket clients.

Code: `UNDO_BLOCK`

Event body contains a [Block](models.md#block).

### UNDO BLOCK EXAMPLES

Event

```json
{
    "code":"UNDO_BLOCK",
    "headers":{
        "id":"6d51c66f-6d4f-4fb4-9e4d-99b250411bf6",
        "type":3
    },
    "body":{
        "id":"79c8a281ce1c73549fca74fa528a8816619bd22a12e33f43c61a7f438a318d6c",
        "version":1,
        "height":893,
        "transactionCount":0,
        "amount":0,
        "fee":0,
        "payloadHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "generatorPublicKey":"83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05",
        "signature":"7e8868db530300d53a7bbd1db71f5b89f4c98a2f35cccc100a880843b63fbb5e4879a642ee2f43ef751c29af49cd471c10de16238e6e91bb7e27c785bbc93a06",
        "relay":2,
        "createdAt":102711510,
        "previousBlockId":"4127b7cbfc9753c67beb9637d2af2ec46e650b51bb53b0ba90f525084ac87bc3"
    }
}
```

## DECLINE TRANSACTION

Sends just declined a transaction to all socket clients.

Code: `DECLINE_TRANSACTION`

Event body

| Parameter   | Type                        | Description          |
|-------------|-----------------------------|----------------------|
| transaction | [Transaction](#transaction) | Declined transaction |
| reason      | Array<[string]>             | Reason               |

### DECLINE TRANSACTION EXAMPLES

Event

```json
{
    "code":"DECLINE_TRANSACTION",
    "headers":{
        "id":"6d51c66f-6d4f-4fb4-9e4d-99b250411bf6",
        "type":3
    },
    "body":{
        "transaction":{
            "id":"568c252bf8ecd33af580caa23027cc349ff652dd7ca21a8cf5fd153e55173322",
            "type":10,
            "createdAt":102188552,
            "senderPublicKey":"f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2",
            "senderAddress":"4995063339468361088",
            "signature":"3147dcad5a0cdfd8ddbb027b42cad685eae18972015c1e13b5489f850700d1b32758680e5521b123afc664d9065bb3a9bc45d578b09ba44a28bf40af63947305",
            "salt":"403e84f2b2bd070f80a1185a298c9a33",
            "relay":0,
            "asset":{
                "recipientAddress":"13917551777668161189",
                "amount":100000000
            },
            "reason": ["Transaction signature is invalid"]
        }
    }
}
```

## UPDATE BLOCKCHAIN INFO

Sends general blockchain information every 10 seconds to all socket clients.

Code: `UPDATE_BLOCKCHAIN_INFO`

Body

| Parameter         | Type   | Description                 |
|-------------------|--------|-----------------------------|
| circulatingSupply | number | Circulating Supply          |
| tokenHolders      | number | Number of token holders     |
| totalConnected    | number | Number of users on the site |
| totalStakeAmount  | number | Total stake amount          |
| totalStakeHolders | number | Number of stake holders     |
| totalSupply       | number | Total supply                |

### UPDATE BLOCKCHAIN INFO EXAMPLES

Event

```json
{
    "code":"UPDATE_BLOCKCHAIN_INFO",
    "headers":{
        "id":"6f53522a-5174-43c3-8493-94c8752aa3dc",
        "type":3
    },
    "body":{
        "totalSupply":4202918410000000,
        "circulatingSupply":297081590000000,
        "tokenHolders":15,
        "totalStakeAmount":3000000000,
        "totalStakeholders":3,
        "totalConnected":1
    }
}
```
