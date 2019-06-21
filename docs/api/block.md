# BLOCK

## GET BLOCK

Returns block without transactions

Code: `GET_BLOCK`

Body parameters

| Parameter | Type   | Is Required | Description       |
|-----------|--------|-------------|-------------------|
| id        | string | +           | Unique identifier |

Response

| Parameter | Type                     | Description      |
|-----------|--------------------------|------------------|
| success   | boolean                  | Operation status |
| data      | [Block](models.md#block) | Requested block  |

### GET BLOCK EXAMPLES

Request

```json
{
    "code":"GET_BLOCK",
    "headers":{
        "id":"a8947030-ef83-4ff3-8194-4e9ca5a8f713",
        "type":1
    },
    "body":{
        "id":"cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0"
    }
}
```

Successful response

```json
{
    "success":true,
    "data":{
        "id":"cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0",
        "version":1,
        "height":1,
        "transactionCount":7,
        "amount":4797000000000000,
        "fee":482700000000,
        "payloadHash":"7e6ba6ec459d96207414f61b67ecd2ecd8c946507bb102a1e47a0ce987e494d0",
        "generatorPublicKey":"f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2",
        "signature":"d664da064f083be23d8845c3dc2572342dfbb3a04c037205d3fee8a973dd7a73dfb1e6dafcdb06b9738c9d7be4f0e5e98f237187f055edb8c307d6cbfa457207",
        "transactions":[

        ],
        "relay":0,
        "createdAt":0,
        "previousBlockId":null
    }
}
```

Failed response

```json
{
   "success": false,
   "errors": ["Block with this id does not exist"]
}
```

## GET BLOCKS

Returns blocks by filter without transactions

Code: `GET_BLOCKS`

Body parameters

| Parameter | Type                          | Is Required | Description |
|-----------|-------------------------------|-------------|-------------|
| filter    | Filter                        | -           | Filter      |
| sort      | array<[Sort](models.md#sort)> | -           | Sort        |
| limit     | number                        | +           | Limit       |
| offset    | number                        | +           | Offset      |

Response

| Parameter   | Type                            | Description                            |
|-------------|---------------------------------|----------------------------------------|
| success     | boolean                         | Operation status                       |
| data.blocks | Array<[Block](models.md#block)> | Blocks                                 |
| data.count  | number                          | Total number of entries for the filter |

### GET BLOCKS EXAMPLES

Request

```json
{
    "code":"GET_BLOCKS",
    "headers":{
        "id":"821ceb52-c7cc-4926-bb77-1d9b3c720861",
        "type":1
    },
    "body":{
        "filter":{

        },
        "sort":[
            [
                "height",
                "DESC"
            ]
        ],
        "offset":0,
        "limit":1
    }
}
```

Successful response

```json
{
    "success":true,
    "data":{
        "blocks":[
            {
                "id":"3fae7fdc6826b8058de39d4f2133cf2bb05f8878b122c7c5417880bb17abc8f5",
                "version":1,
                "height":149,
                "transactionCount":0,
                "amount":0,
                "fee":0,
                "payloadHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "generatorPublicKey":"137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a",
                "signature":"520eef327cca356cda3c7c48388a057f1b18d58c34b60c8878943ce1c159398f97fae18013fe9adaee9b558022ac75551c7ba85f03126c734cb13e9cdc08ad08",
                "transactions":[

                ],
                "relay":0,
                "createdAt":102515710,
                "previousBlockId":"8b75ed682a66b2900f91de177aea6cd513113a656a7890034e3247243fc70e05"
            }
        ],
        "count":149
    }
}
```

## GET BLOCK BY HEIGHT

Returns block by height without transactions

Code: `GET_BLOCK_BY_HEIGHT`

Body parameters

| Parameter | Type                          | Is Required | Description  |
|-----------|-------------------------------|-------------|--------------|
| height    | number                        | +           | Block height |

Response

| Parameter   | Type                            | Description                            |
|-------------|---------------------------------|----------------------------------------|
| success     | boolean                         | Operation status                       |
| data        | [Block](models.md#block)        | Requested block                        |

### GET BLOCK BY HEIGHT EXAMPLES

Request

```json
{
    "code":"GET_BLOCK_BY_HEIGHT",
    "headers":{
        "id":"821ceb52-c7cc-4926-bb77-1d9b3c720861",
        "type":1
    },
    "body":{
        "height":1
    }
}
```

Successful response

```json
{
    "success":true,
    "data":{
        "id":"aa766bd5342fcde5f7d21ac52a6c0361e9e90a0df54632a22b4110c5d469af28",
        "version":1,
        "height":1,
        "transactionCount":21,
        "amount":4797000000000000,
        "fee":0,
        "payloadHash":"250ef38d19cf927f4cd9e176b5bfd2b953ef7521a5383e4c0b2b0894a93306c6",
        "generatorPublicKey":"86231c9dc4202ba0e27e063f431ef868b4e38669931202a83482c70091714e13",
        "signature":"83abaa4eddfdfc59b17e57d9b9a4dd41f8c3b26bb100e68ae5395f9e2d20e7f4e0fcebde211b5de72078d2a101d7e90cab426511a666c4f0ddab220493a8470c",
        "relay":0,
        "transactions":[],
        "createdAt":0,
        "previousBlockId":null
    }
}
```

## GET LAST BLOCK

Returns last appied block without transactions

Code: `GET_LAST_BLOCK`

Response

| Parameter   | Type                            | Description                            |
|-------------|---------------------------------|----------------------------------------|
| success     | boolean                         | Operation status                       |
| data        | [Block](models.md#block)        | Last block                             |

### GET LAST BLOCK EXAMPLES

Request

```json
{
    "code":"GET_LAST_BLOCK",
    "headers":{
        "id":"821ceb52-c7cc-4926-bb77-1d9b3c720861",
        "type":1
    },
    "body":{}
}
```

Successful response

```json
{
    "success":true,
    "data":{
        "id":"fb41fcaa1a3a1fdf05131f6e2b6725d4d94d309dca85352bfda36cf1eedf2618",
        "version":1,
        "height":250949,
        "transactionCount":3,
        "amount":310000000,
        "fee":41000,
        "payloadHash":"a4f3c59c690bf18ce206b5dafdfe6d9a26713f7a230019e7f83c8c439b164c0f",
        "generatorPublicKey":"276f0d09e64b68566fb458b7c71aeb62411d0b633ad6c038e5a4a042ec588af9",
        "signature":"a8f22d95e7383378f1e138c77f20244b0ee24d9c159aff8708c1856aa0996e81b8bc7ded32b17d9f4326d593eeabc51e30949bf84537632daf6cc155c0def803",
        "relay":0,
        "transactions":[],
        "createdAt":109456340,
        "previousBlockId":"ad35239706b1b231f0ca7a73166dbcb89d948609103ef8496fbac3f3ad4fb131"
    }
}
```
