# GENERAL

## GET BLOCKCHAIN INFO

Request for getting general blockchain information.

Code: `GET_BLOCKCHAIN_INFO`

Body

| Parameter         | Type   | Description                 |
|-------------------|--------|-----------------------------|
| circulatingSupply | number | Circulating Supply          |
| tokenHolders      | number | Number of token holders     |
| totalConnected    | number | Number of users on the site |
| totalStakeAmount  | number | Total stake amount          |
| totalStakeHolders | number | Number of stake holders     |
| totalSupply       | number | Total supply                |

### Examples

Request

```json
{
    "code":"GET_BLOCKCHAIN_INFO",
    "headers":{
        "id":"8c74053c-aa72-4a22-950c-8b55e8bfcdce",
        "type":1
    },
    "body":""
}
```

Response

```json
{
    "code":"GET_BLOCKCHAIN_INFO",
    "headers":{
        "id":"8c74053c-aa72-4a22-950c-8b55e8bfcdce",
        "type":2
    },
    "body":{
        "totalSupply":4200985213590000,
        "circulatingSupply":299014786410000,
        "tokenHolders":143,
        "totalStakeAmount":55200000000,
        "totalStakeHolders":91,
        "totalConnected":13
    }
}
```
