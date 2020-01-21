# Block Bytes

## Get bytes

Get bytes is converting main block data to a buffer

The main block data are:

1. Version
2. Creation time
3. Transaction count
4. Amount
5. Fee
6. Previous block id
7. Payload hash
8. Generator public key

In some cases, the bytes may contain a `signature`

Amount of bytes to allocate (safe alloc) for each field: 

| Field                | Type           | Bytes | Required |
|----------------------|----------------|-------|----------|
| version              | int32          | 4     | true     |
| createdAt            | int32          | 8     | true     |
| transactionCount     | int32          | 4     | true     |
| amount               | uint64         | 8     | true     |
| fee                  | uint64         | 8     | true     |
| previousBlockId      | string         | 32    | true     |
| payloadHash          | string         | 32    | true     |
| generatorPublicKey   | string         | 32    | true     |
| signature            | string         | 64    | false    |

Bytes should be written in `Little Endian` order and in order that shown in table.

`for compatibility, after timestamp we should write 4 bytes filled with 0`

### Example get bytes

Get bytes from a block

```json
{
    "version": 1,
    "createdAt": 124999700,
    "transactionCount": 2,
    "amount": 400000000,
    "fee": 40000,
    "previousBlockId": "cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0",
    "payloadHash": "5df1d5d1ba5e14501e9b7bd5bbb2104b1df871bccd4ddc07435ce799da6aad5c",
    "generatorPublicKey": "301c99b6ee57807664eae0a43a58c7d39c5e8a6441aa2239e2024046161e652f",
    "signature": "b0643b8e0aa2632270d0cd24bf8dc620497ca0eea501acfa99f6e1b55a9f5b971f22092e52da4798ed1bfe1105277e5a58a9a5f31ad8b2203a0c7573b4f60e0e"
}
```

The result of getting bytes from this bytes will be the following buffer

For convenience, it is converted to hexadecimal code

```text
010000001458730702000000000000000084d71700000000409c000000000000cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab05df1d5d1ba5e14501e9b7bd5bbb2104b1df871bccd4ddc07435ce799da6aad5c301c99b6ee57807664eae0a43a58c7d39c5e8a6441aa2239e2024046161e652fb0643b8e0aa2632270d0cd24bf8dc620497ca0eea501acfa99f6e1b55a9f5b971f22092e52da4798ed1bfe1105277e5a58a9a5f31ad8b2203a0c7573b4f60e0e
```
