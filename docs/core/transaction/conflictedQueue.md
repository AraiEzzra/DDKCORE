# Transaction conflicted queue


Conflicted transaction queue is designed to store transaction, which can be conflicted during the processing.

To check transaction on potential conflict, you need to get `depend` transactions. 

Depend transaction include transactions from [transaction pool](transaction/pool.md), where current sender address is recipient or sender.

Transaction is conflicted if:

* Transaction type is `Signature`
* Transaction type is `Referral` and you already have transaction of such type in `depend` transactions
* Transaction has a higher [priority](transaction/priority.md) in depend transactions
