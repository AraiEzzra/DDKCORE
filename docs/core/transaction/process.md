# Transaction process

Before transaction process, you need to check:
* Transaction `queue` must be not empty
* Transaction `queue` must be [unlocked](transaction/queue.md)
* Synchronization must be not active in current moment
* Core must have connection with one or more peers

To process the transaction you need:
* To extract the first transaction from [transaction queue](transaction/queue.md) and check transaction pool for absence of this transaction
* To check on [potential conflict](transaction/conflictedQueue.md), if the transaction is `potential conflict`, you need to push it to conflict queue
* To calculate fee, if transaction type is `vote`
* To [verify](transaction/verificationUnconfirmed.md)
* If transaction `queue` is `unlocked`, you need to push the transaction into [transaction pool](transaction/pool.md)
* If transaction `queue` is `locked`, you need to push the transaction into transaction `queue`
