# Block Payload Hash

## Payload Hash Calculation

[Get bytes](../transaction/bytes.md) from Transactions. The bytes must contain a signature and if exists the second signature.

Calculate [sha256](https://en.wikipedia.org/wiki/SHA-2) hash from the data buffer, convert the result 
to a hex string and apply it to the block
