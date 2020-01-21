# Verification unconfirmed transaction
Transaction verify takes place in several steps.
 * Check the absence of sender `address` in black list.
 * Check the absence of transaction `id` in [transaction storage](transaction/memoryStorage.md).
 * Verifying the `signature` of transaction.
 To verify `signature`, you need to get a data buffer from type of transaction, creation time, salt, sender public key and asset.
 Create hash sha256 from data buffer, using [NodeJS Crypto](https://nodejs.org/api/crypto.html)
 get buffer from signature, buffer from sender public key and verify signature using [sodium-native](https://www.npmjs.com/package/sodium-native) and method crypto_sign_verify_detached
 * If the sender have second public key, we must to verify second signature of the transaction, using the same algoritm of verifying signature.
 * Time of creation transaction must be the same or less then current slot time.
 * Transaction must be not five days older then current slot
 * Check transaction amount.
 Sender account `balance` must be the same or more then sum of transaction `amount` and transaction `fee`
 * Verify transaction [asset](transaction/asset/index.md)
