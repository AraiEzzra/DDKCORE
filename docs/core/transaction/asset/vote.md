# Transaction vote asset

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
