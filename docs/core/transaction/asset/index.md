# Transaction asset

DDK using multiple transaction types:

| Type      | Code   |
|-----------|--------|
| REFERRAL  | 0      |
| SEND      | 10     |
| SIGNATURE | 20     |
| DELEGATE  | 30     |
| STAKE     | 40     |
| VOTE      | 60     |

Each transaction type has its own asset.

* Send
    + [Get Bytes](send#get-bytes)
    + [Verify](send#verify)
* Referral
    + [Verify](referral#verify)
* Delegate
    + [Verify](delegate#verify)
* Signature
    + [Verify](signature#verify)
* Stake
    + [Verify](stake#verify)
* Vote
    + [Verify](vote#verify)
