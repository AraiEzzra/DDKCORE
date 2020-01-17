# Transaction Bytes

## Get bytes

Get bytes is converting main transaction data to a buffer

The main transaction data are:

1. Type
2. Creation time
3. Salt
4. Sender public key
5. Asset

In some cases, the bytes may contain a signature and a second signature

### Example get bytes

Get bytes from a transaction

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
14da3a9806894cdfa99bc38ca098d38d305c811496f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc21aa981869d400a578c11c6dd0d65fa89a21557db44e5d876dcd0cc461db1bfd2
```
