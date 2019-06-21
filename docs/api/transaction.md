# TRANSACTION

## CREATE TRANSACTION

Creates transaction and returns it.

Code: `CREATE_TRANSACTION`

Body parameters

| Parameter    | Type        | Is Required | Description           |
|--------------|-------------|-------------|-----------------------|
| secret       | string      | +           | Account secret        |
| secondSecret | string      | -           | Account second secret |
| trs          | Transaction | +           | Account address       |

Response

| Parameter | Type        | Description         |
|-----------|-------------|---------------------|
| success   | boolean     | Operation status    |
| data      | Transaction | Created transaction |

### Examples

Request

```json
{
   "code":"CREATE_TRANSACTION",
   "headers":{
      "id":"f66dbdf3-2860-453d-a535-c1ee8415eb71",
      "type":1
   },
   "body":{
      "secret":"empty hand absent pepper reward music top foil violin disease target exhibit",
      "trs":{
         "senderPublicKey":"f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2",
         "type":10,
         "asset":{
            "amount":100000000,
            "recipientAddress":"13917551777668161189"
         }
      }
   }
}
```

Successful response

```json
{
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
   }
}
```

Failed response

```json
{
   "success":false,
   "errors":[
      "IS NOT VALID REQUEST:'CREATE_TRANSACTION'... Reference could not be resolved: CREATE_TRANSACTION"
   ]
}
```

## GET TRANSACTION

Request for getting a transaction. Returns transaction or null if the transaction does not exist.

Code: `GET_TRANSACTION`

Body parameters

| Parameter | Type   | Is Required | Description    |
|-----------|--------|-------------|----------------|
| id        | string | +           | Transaction id |

Response

| Parameter | Type    | Description       |
|-----------|---------|-------------------|
| success   | boolean | Operation status  |
| data      | Account | Requested account |

### GET TRANSACTION EXAMPLES

Request

```json
{
   "code":"GET_TRANSACTION",
   "headers":{
      "id":"8f6ab64d-02bc-46c8-a42d-249c5fab077a",
      "type":1
   },
   "body":{
      "id":"c7d80bf1bb220e62735bd388549a87c0cd93b8be30a1ae2f7291ce20d2a94b79"
   }
}
```

Successful response

```json
{
   "success":true,
   "data":{
      "id":"c7d80bf1bb220e62735bd388549a87c0cd93b8be30a1ae2f7291ce20d2a94b79",
      "blockId":"cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0",
      "type":10,
      "createdAt":0,
      "senderPublicKey":"49a2b5e68f851a11058748269a276b0c0d36497215548fb40d4fe4e929d0283a",
      "senderAddress":"12384687466662805891",
      "signature":"226ed984bf3d82b7c332ce48bc976fcc35930d22cb068b2e9de993a4fb3e402d4bdb7077d0923b8dd2c205e6a2473884752615c0787967b218143eec5df1390c",
      "secondSignature":null,
      "salt":"a7fdae234eeb416e31f5f02571f54a0c",
      "asset":{
         "recipientAddress":"4995063339468361088",
         "amount":4500000000000000
      }
   }
}
```

Failed response

```json
{
   "success":false,
   "data":null
}
```

## GET TRANSACTIONS

Search for specified transactions

Code: `GET_TRANSACTIONS`

Body parameters

| Parameter | Type                                   | Is Required | Description                |
|-----------|----------------------------------------|-------------|----------------------------|
| filter    | [Transaction Type](#transaction-types) | -           | Filter by transaction type |
| sort      | array<[Sort](models.md#sort)>          | -           | Sort                       |
| limit     | number                                 | +           | Limit                      |
| offset    | number                                 | +           | Offset                     |

Response

| Parameter         | Type                                        | Description                            |
|-------------------|---------------------------------------------|----------------------------------------|
| success           | boolean                                     | Operation status                       |
| data.transactions | array<[Transaction](models.md#transaction)> | Transactions                           |
| data.count        | number                                      | Total number of entries for the filter |

### GET TRANSACTIONS EXAMPLES

Request

```json
{
   "code":"GET_TRANSACTIONS",
   "headers":{
      "id":"f6122db2-0f04-41d0-a22d-758176f8771a",
      "type":1
   },
   "body":{
      "filter":{
         "sender_public_key":"f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2",
         "block_id":"2313006c8b7f5a628ef5a085d7b8ddb37244dcbe24452da12801bf69870e4e0d",
         "type":10
      },
      "sort":[
         [
            "createdAt",
            "DESC"
         ]
      ],
      "limit":1,
      "offset":0
   }
}
```

Successful response

```json
{
   "success":true,
   "data":{
      "transactions":[
         {
            "id":"568c252bf8ecd33af580caa23027cc349ff652dd7ca21a8cf5fd153e55173322",
            "blockId":"2313006c8b7f5a628ef5a085d7b8ddb37244dcbe24452da12801bf69870e4e0d",
            "type":10,
            "createdAt":102188552,
            "senderPublicKey":"f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2",
            "senderAddress":"4995063339468361088",
            "signature":"3147dcad5a0cdfd8ddbb027b42cad685eae18972015c1e13b5489f850700d1b32758680e5521b123afc664d9065bb3a9bc45d578b09ba44a28bf40af63947305",
            "secondSignature":null,
            "salt":"403e84f2b2bd070f80a1185a298c9a33",
            "asset":{
               "recipientAddress":"13917551777668161189",
               "amount":100000000
            }
         }
      ],
      "count":5
   }
}
```

Failed response

```json
{
   "success":false,
   "errors":[
      "IS NOT VALID REQUEST:'GET_TRANSACTIONS'... Reference could not be resolved: GET_TRANSACTIONS"
   ]
}
```

## GET TRANSACTIONS BY BLOCK ID

Search transactions by block id

Code: `GET_TRANSACTIONS_BY_BLOCK_ID`

Body parameters

| Parameter | Type   | Is Required | Description |
|-----------|--------|-------------|-------------|
| blockId   | string | +           | Block id    |
| limit     | number | +           | Limit       |
| offset    | number | +           | Offset      |

Response

| Parameter         | Type                                        | Description                  |
|-------------------|---------------------------------------------|------------------------------|
| success           | boolean                                     | Operation status             |
| data.transactions | array<[Transaction](models.md#transaction)> | Transactions                 |
| data.count        | number                                      | Total number of transactions |

### GET TRANSACTIONS BY BLOCK ID EXAMPLES

Request

```json
{
   "code":"GET_TRANSACTIONS_BY_BLOCK_ID",
   "headers":{
      "id":"d388bfb1-3ed4-4e8f-ad77-d39f753653b9",
      "type":1
   },
   "body":{
      "blockId":"2313006c8b7f5a628ef5a085d7b8ddb37244dcbe24452da12801bf69870e4e0d",
      "limit":1,
      "offset":0
   }
}
```

Successful response

```json
{
   "success":true,
   "data":{
      "transactions":[
         {
            "id":"2c52682e6a51a9ddfd48a679a95c9fea4e693790aec5968535a482088b6c75bf",
            "blockId":"cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0",
            "type":10,
            "createdAt":0,
            "senderPublicKey":"f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2",
            "senderAddress":"4995063339468361088",
            "signature":"dfe6697977493108a37dfd2727c85bd88d8aaf062973bdf6e4b99dd024a251e91319267b0e6e51731fa32ffd89b160d93a4bbd59f0c129bc669598b522da8000",
            "secondSignature":null,
            "salt":"6f5b997e54d3f6a249d9be019814a66a",
            "asset":{
               "recipientAddress":"7897332094363171058",
               "amount":90000000000000
            }
         }
      ],
      "count":7
   }
}
```

Failed response

```json
{
   "success":false,
   "errors":[
      "IS NOT VALID REQUEST:'GET_TRANSACTIONS_BY_BLOCK_ID'... Reference could not be resolved: GET_TRANSACTIONS_BY_BLOCK_ID"
   ]
}
```

## GET TRANSACTIONS BY HEIGHT

Returns transactions with requested height

Code: `GET_TRANSACTIONS_BY_HEIGHT`

Body parameters

| Parameter | Type   | Is Required | Description  |
|-----------|--------|-------------|--------------|
| height    | number | +           | Block height |
| limit     | number | +           | Limit        |
| offset    | number | +           | Offset       |

Response

| Parameter         | Type                                        | Description                            |
|-------------------|---------------------------------------------|----------------------------------------|
| success           | boolean                                     | Operation status                       |
| data.transactions | [Transactions](models.md#transaction)       | Transactions by requested block height |
| data.count        | number                                      | Total number of entries for the block  |

### GET TRANSACTIONS BY HEIGHT EXAMPLES

Request

```json
{
   "code":"GET_TRANSACTIONS_BY_HEIGHT",
   "headers":{
      "id":"d388bfb1-3ed4-4e8f-ad77-d39f753653b9",
      "type":1
   },
   "body":{
      "height":1,
      "limit":1,
      "offset":0
   }
}
```

Successful response

```json
{
   "success":true,
   "data":{
      "transactions":[
         {
               "id":"18ecf494840cfb3ad59d521e5896d6e4bce15aca4988722741a5e47446de3aa5",
               "blockId":"aa766bd5342fcde5f7d21ac52a6c0361e9e90a0df54632a22b4110c5d469af28",
               "type":10,
               "createdAt":0,
               "senderPublicKey":"e0ead349bfb8851d3f4949862f89a93e8c5dd31c345092b34f92b8c1fabfc8b3",
               "senderAddress":"17119487529442639627",
               "signature":"f93b31e7bad55ff41fb01cc7501928919d0a0d9932cafaeafcab94700eade698b251a6b8b80ae7d566e1912cdd17dc2afffc7b58f92a35cc197e309289386f09",
               "secondSignature":null,
               "fee":0,
               "salt":"9e0910c2e2eab7ae84f6c18f306d5157",
               "relay":0,
               "confirmations":251039,
               "asset":{
                  "recipientAddress":"13566253584516829136",
                  "amount":4500000000000000
               }
         }
      ],
      "count":21
   }
}
```
