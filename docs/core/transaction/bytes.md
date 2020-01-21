# Transaction Bytes

## Get bytes

Get bytes is converting main transaction data to a buffer

| Field           | Type         | Bytes | Required |
|-----------------|--------------|-------|----------|
| type            | int8         | 1     | +        |
| createdAt       | int32        | 4     | +        |
| salt            | string       | 16    | +        |
| senderPublicKey | string       | 32    | +        |
| asset           | byte array   | X     | +        |
| signature       | string       | 64    | -        |
| secondSignature | string       | 64    | -        |

Bytes should be written in `Little Endian` order and in order that shown in table

### Example get bytes

Get bytes from a send transaction

```json
{
    "createdAt": 110639834,
    "salt": "894cdfa99bc38ca098d38d305c811496",
    "senderPublicKey": "f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2",
    "type": 10,
    "asset": {
        "amount": 10000000000,
        "recipientAddress": "4957046151241062485",
    }
}
```

The result of getting bytes from this transaction will be the following buffer

For convenience, it is converted to hexadecimal code

```text
0ada3a9806894cdfa99bc38ca098d38d305c811496f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc236f7ca4455d8f0030200000000e40b54
```
