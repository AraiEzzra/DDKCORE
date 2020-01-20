# Block verification

To verify block you need to verify signature, id and payload hashes

#### Signature

To verify `signature`, you need:
 * data buffer from block generator `public key` hash
 * data buffer from block `signature` hash
 * [get bytes](bytes.md) from block without signature and calculate [sha256](https://en.wikipedia.org/wiki/SHA-2), 
 using [NodeJS Crypto](https://nodejs.org/api/crypto.html)
 
For sign verification use [sodium-native](https://www.npmjs.com/package/sodium-native)

#### ID

[Get bytes](bytes.md) from signed block and compare result with existing `id`.

#### Payload

Calculate [payload hash](payload_hash.md) and compare result with existing `payload hash`

#### Generator Public Key

Generator Public Key should exist in current round and generator slot should be equal block slot number

#### Block Slot Number

Block can be forged in current slot

#### Height

Block height should be equal `last block height + 1`

#### Previous block id 

Previous block id should be equal last block id
