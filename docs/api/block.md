# BLOCK

## GET BLOCK

Returns block without transactions

Code: `GET_BLOCK`

Body parameters

| Parameter | Type   | Is Required | Description       |
|-----------|--------|-------------|-------------------|
| id        | string | +           | Unique identifier |

Response

| Parameter | Type    | Description      |
|-----------|---------|------------------|
| success   | boolean | Operation status |
| data      | Block   | Requested block  |

### Examples

Request

```
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

```
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

```
{
   "success": false,
   "errors": ["Block with this id does not exist"]
}
```

## GET BLOCKS

Returns block without transactions

Code: `GET_BLOCKS`

Body parameters

| Parameter | Type        | Is Required | Description |
|-----------|-------------|-------------|-------------|
| filter    | Filter      | -           | Filter      |
| sort      | array[Sort] | -           | Sort        |
| limit     | number      | -           | Limit       |
| offset    | number      | -           | Offset      |

Response

| Parameter   | Type         | Description                            |
|-------------|--------------|----------------------------------------|
| success     | boolean      | Operation status                       |
| data.blocks | Array[Block] | Blocks                                 |
| data.count  | number       | Total number of entries for the filter |

### Examples

Request

```
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

```
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
