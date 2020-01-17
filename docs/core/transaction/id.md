# Transaction ID

## ID Calculation

We get bytes from signed transaction. The bytes must contain a signature and if exists the second signature

Calculates [sha256](https://en.wikipedia.org/wiki/SHA-2) hash from the data buffer, convert the result to a hex string and apply to the transaction
