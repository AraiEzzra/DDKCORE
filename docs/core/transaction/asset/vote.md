# Transaction vote asset

```json
{ 
   "votes":[ 
      "+346c289605878e7cfe49e824bcc12faa773b3714e8ef6281d0d99c0c3048d2b6",
      "-5c6e95e404b1c78ecfaf897fdc0003679ba4c5397635a39c7a2cb358eecba7db"
   ],
   "reward":0,
   "unstake":0,
   "airdropReward":{ 
      "sponsors":[ 
         [ 
            "12836959705098885161",
            500000
         ]
      ]
   }
}
```

## Verify

To verify `vote asset`, you need to check:
* The existing of `active stakes`
* Calculate total `reward` and compare with asset `reward`
* Calculate total `unstake amount` and comare with asset `unstake`
* Verify airdrop
* For transaction vote `+`, you need to check on double `vote` for one delegate
* For transaction down vote `-`, you need to check on existing `vote` for this delegate
* Existing the account we vote for
* Account we vote for must be delegate
* Count of votes must be not more then 201
