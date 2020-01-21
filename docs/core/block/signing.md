# Block Signing

## Signing

For signing block DDK uses [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519)

To create a block signature, you need to [get bytes](signing.md) of this block

The bytes are signed with the user's private key, received signature buffer converts to a hex string and apply to the block
