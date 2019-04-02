# DELEGATE

## GET DELEGATES

Code: `GET_DELEGATES`

Body parameters

| Parameter | Type   | Is Required | Description |
|-----------|--------|-------------|-------------|
| limit     | number | -           | Limit       |
| offset    | number | -           | Offset      |

Response

| Parameter      | Type                                  | Description             |
|----------------|---------------------------------------|-------------------------|
| success        | boolean                               | Operation status        |
| data.delegates | Array<[Delegate](models.md#delegate)> | Delegates               |
| data.count     | number                                | Total number of entries |

### Examples

Request

```
{
    "code":"GET_DELEGATES",
    "headers":{
        "id":"1ae621d9-ca48-4f14-96a7-bdb11600335d",
        "type":1
    },
    "body":{
        "limit":3,
        "offset":0
    }
}
```

Successful response

```
{
    "success":true,
    "data":{
        "delegates":[
            {
                "username":"delegate3",
                "missedBlocks":0,
                "forgedBlocks":0,
                "publicKey":"137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a",
                "votes":0
            },
            {
                "username":"delegate1",
                "missedBlocks":0,
                "forgedBlocks":0,
                "publicKey":"83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05",
                "votes":0
            },
            {
                "username":"delegate2",
                "missedBlocks":0,
                "forgedBlocks":0,
                "publicKey":"f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7",
                "votes":0
            }
        ],
        "count":3
    }
}
```

## GET ACTIVE DELEGATES

Code: `GET_ACTIVE_DELEGATES`

Body parameters

| Parameter | Type   | Is Required | Description |
|-----------|--------|-------------|-------------|
| limit     | number | -           | Limit       |
| offset    | number | -           | Offset      |

Response

| Parameter      | Type                                  | Description             |
|----------------|---------------------------------------|-------------------------|
| success        | boolean                               | Operation status        |
| data.delegates | Array<[Delegate](models.md#delegate)> | Delegates               |
| data.count     | number                                | Total number of entries |

### Examples

Request

```
{
    "code":"GET_ACTIVE_DELEGATES",
    "headers":{
        "id":"04198081-b5f0-4779-84fd-50d17bcb325e",
        "type":1
    },
    "body":{
        "limit":3,
        "offset":0
    }
}
```

Successful response

```
{
    "success":true,
    "data":{
        "delegates":[
            {
                "username":"delegate1",
                "missedBlocks":0,
                "forgedBlocks":0,
                "publicKey":"83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05",
                "votes":0
            },
            {
                "username":"delegate2",
                "missedBlocks":0,
                "forgedBlocks":0,
                "publicKey":"f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7",
                "votes":0
            },
            {
                "username":"delegate3",
                "missedBlocks":0,
                "forgedBlocks":0,
                "publicKey":"137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a",
                "votes":0
            }
        ],
        "count":3
    }
}
```

## GET MY DELEGATES

Code: `GET_MY_DELEGATES`

Body parameters

| Parameter | Type   | Is Required | Description          |
|-----------|--------|-------------|----------------------|
| address   | string | +           | User account address |
| limit     | number | -           | Limit                |
| offset    | number | -           | Offset               |

Response

| Parameter      | Type                                  | Description             |
|----------------|---------------------------------------|-------------------------|
| success        | boolean                               | Operation status        |
| data.delegates | Array<[Delegate](models.md#delegate)> | Delegates               |
| data.count     | number                                | Total number of entries |

### Examples

Request

```
{
    "code":"GET_MY_DELEGATES",
    "headers":{
        "id":"b0497776-f529-4e61-967a-2437cd36f618",
        "type":1
    },
    "body":{
        "address":"4995063339468361088",
        "offset":0,
        "limit":10
    }
}
```

Successful response

```
{
    "success":true,
    "data":{
        "delegates":[
            {
                "username":"delegate2",
                "missedBlocks":0,
                "forgedBlocks":0,
                "publicKey":"f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7",
                "votes":0
            }
        ],
        "count":1
    }
}
```
