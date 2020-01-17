# Transaction Signing

## Signing

For signing transaction DDK uses [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519)

To create a transaction signature, we need to get the bytes of this transaction

The bytes are signed with the user's private key, received signature buffer converts to a hex string and apply to the transaction

## Second signing

For creating a second signature, transaction should be [signed](bytes.md#signing)

We get bytes from signed transaction. The bytes must contain transaction signature

The bytes are signed with the user's second private key, received buffer with second signature converts to a hex string and apply to the transaction
