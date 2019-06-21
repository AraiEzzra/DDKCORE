# ACCOUNT

## GET ACCOUNT

Request for getting an account. Returns account or null if the account does not exist.

Code: `GET_ACCOUNT`

Body parameters

| Parameter | Type   | Is Required | Description     |
|-----------|--------|-------------|-----------------|
| address   | string | +           | Account address |

Response

| Parameter | Type    | Description       |
|-----------|---------|-------------------|
| success   | boolean | Operation status  |
| data      | Account | Requested account |

### GET ACCOUNT EXAMPLES

Request

```json
{
   "code":"GET_ACCOUNT",
   "headers":{
      "id":"a3a76922-235e-498c-b896-0b1167ba9daa",
      "type":1
   },
   "body":{
      "address":"4995063339468361088"
   }
}
```

Successful response

```json
{
   "success":true,
   "data":{
      "address":"4995063339468361088",
      "isDelegate":false,
      "publicKey":"f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2",
      "actualBalance":4202990199580000,
      "referrals":[

      ],
      "votes":[

      ],
      "stakes":[

      ]
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

## GET ACCOUNT BALANCE

Request for getting an account balance. Returns account balance or null if the account does not exist.

Code: `GET_ACCOUNT_BALANCE`

Body parameters

| Parameter | Type   | Is Required | Description     |
|-----------|--------|-------------|-----------------|
| address   | string | +           | Account address |

Response

| Parameter | Type    | Description               |
|-----------|---------|---------------------------|
| success   | boolean | Operation status          |
| data      | number  | Requested account balance |

### GET ACCOUNT BALANCE EXAMPLES

Request

```json
{
   "code":"GET_ACCOUNT_BALANCE",
   "headers":{
      "id":"a3a76922-235e-498c-b896-0b1167ba9daa",
      "type":1
   },
   "body":{
      "address":"4995063339468361088"
   }
}
```

Successful response

```json
{
   "success":true,
   "data": 4202989898990000
}
```

Failed response

```json
{
   "success":false,
   "data":null
}
```
