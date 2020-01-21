# Block Forging

## Forging

Firstly you need to get sorted transactions from [transaction pool](../transaction/pool.md).

Use generator `public key`, `timestamp`, `previous block` and transactions from pool to create unsigned block.

<details>
  <summary>Example of unsigned block</summary>
  
```json
{
    "version": 1,
    "createdAt": 124999700,
    "height": 2,
    "previousBlockId": "cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0",
    "transactionCount": 2,
    "amount": 400000000,
    "fee": 40000,
    "generatorPublicKey": "301c99b6ee57807664eae0a43a58c7d39c5e8a6441aa2239e2024046161e652f",
    "transactions": [{
        "id": "4c3cf6dcd0a8a3d907ab562f2bef795c55c57edbfb07cf958a4b676027974e93",
        "blockId": "e1abaec40cb3ac3ba79c3d3ac3a1d3405a24da78a202a528b1728e18c50048b4",
        "type": 10,
        "createdAt": 124999390,
        "senderPublicKey": "f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2",
        "senderAddress": "4995063339468361088",
        "signature": "4c4110a7bcc7634234f93676a7c32703f4fefaf5e17a982610b037f3ee8e0514f7f9b6e5957c9f35c51145cda75312f26184b824a10741e9a872be6120930601",
        "secondSignature": "",
        "fee": 20000,
        "salt": "ca228176e6aabedeea82acd8d1e34d60",
        "asset": {
            "recipientAddress": "15450248553013606895",
            "amount": 200000000
        }
    }]
}
```
  
</details>

To finish forging you have to:

 * calculate [payload hash](payload_hash.md)
 * [sign](signing.md) block
 * [calculate block id](id.md)
