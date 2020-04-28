# Create Transaction

Input data required for creating transaction: 

* [type](asset/index.md#types)
* senderData
    * senderPublicKey
    * senderAddress
    * passphrase
    * second passphrase (optional)
* [asset](asset/index.md#assets)

```
createTransaction(type, senderData, asset) {
    
    Create Timestamp using time service
    Generate transaction Salt
    Create Asset based on transaction type and input data
    Calculate Fee based on transaction type and input data

        Create base unsigned transaction based on input data and data above

        Create key pair useing sender passphrase
        Sign transaction using unsigned transaction and key pair
        IF sender has second passphrase
            Sign transaction using second key pair and signed transaction
        Calculate transaction ID using signed transaction (or transaction with second signature if needed)
        Serialize transaction based on transaction type

    return
}

Send transaction to blockchain
```

Reference:

* [timestamp](timestamp.md) // todo
* [salt](salt.md) // todo
* transaction [sign](signing.md#signing)
* transaction [second sign](signing.md#second-signing)
* calculate transaction [id](id.md)
