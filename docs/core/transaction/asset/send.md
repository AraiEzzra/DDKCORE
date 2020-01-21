# Asset Send

## Get bytes

| Field            | Type         | Bytes | Required |
|------------------|--------------|-------|----------|
| recipientAddress | uint64       | 8     | +        |
| amount           | uint64       | 8     | +        |

Bytes should be written in `Little Endian` order and in order that shown in table

## Example get bytes

Get bytes from a send asset

```json
{
    "amount": 10000000000,
    "recipientAddress": "4957046151241062485",
}
```

The result of getting bytes from this asset will be the following buffer

For convenience, it is converted to hexadecimal code

```text
36f7ca4455d8f0030200000000e40b54
```


## Verify

To verify `send asset`, you need to check the sender account `balance`, it must be the same or more
then sum of transaction amount and transaction `fee`

## Example Asset Send

```json
{
    "recipientAddress": "15701569034897442085",
    "amount": 1000
}
```
