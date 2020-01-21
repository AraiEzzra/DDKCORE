# Transaction pool

Transaction queue is designed to store unconfirmed transactions.

Transaction queue have state lock/unlock.

When transaction queue unlock, you need to remove all transaction from [conflict queue](transaction/conflictedQueue.md)
 and to push them into `queue`.

Then you need to sort the queue by priority
