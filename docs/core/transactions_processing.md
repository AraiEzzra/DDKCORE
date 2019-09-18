# Transactions processing


The transaction lifecycle is determined by 2 checks.

A newly submitted transaction is pushed into the **transaction queue**. While transaction is in the queue it is ***checked for conflict with other transactions*** in the transaction queue.

* If there is a conflict then the transaction is pushed into the conflict queue. In the conflict queue the whole blockchain votes on which one of the conflicting transactions is valid. The one that is valid is pushed back is returned to the transaction queue.

After the transaction queue the transaction is pushed into the **transaction pool**.  In the transaction pool transactions are ***checked for validity***. Top 250 validated transactions from the transaction pool are applied to the **new block**. The block time is 10 seconds which results in transaction rate of 25 transactions per second for the [1.1.12 version of the core](https://github.com/AraiEzzra/DDKCORE/tree/1.1.12).

![Image](images/transaction_lifecycle.png)
    
Transaction types

DDK has 7 types of transactions. Each transaction has 7 static fields and 1 dynamic field. Dynamic field "asset" defines the transaction type and may contain additional fields specific to this exact transaction type.    

![Image](images/transaction_fields_and_types.png)

The new block is generated based on top 250 transactions validated from transaction pool. Before applying the new block the transaction queue is locked. The newly formed block is broadcasted into the network to be validated and added to the blockchain.

![Image](images/generate_new_block.png)

After the block is generated and broadcasted the node receives similar broadcasted blocks from other nodes. When the node receives a broadcasted block it firstly checks if this block is the latest block that the node voted for. If it is then our node keeps up with the voting pace and it can proceed with re-sending this block to other nodes to verify consensus for transactions.

![Image](images/received_broadcasted_block.png)

If the newly created block is not validated after broadcast - it will be handled as problematic block. The reasons for generation of problematic blocks may include network errors, block broadcasting delays or attacks on the network.

![Image](images/problematic_blocks_handling.png)

In order to maintain consensus DDK network has an algorithm for defining block height. Block height is a total amount of blocks applied by the network. DDK consensus algorithm covers cases of receiving blocks with equal block height, greater block height and lesser block height.

![Image](images/block_height_handling.png)

A newly installed node or a node that falls out of the network for some reason have an algorithm of getting back on board with the rest of the network. This procedure is called **synchronization**.

![Image](images/network_synchronization.png)
