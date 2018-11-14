>
> Some methods are described in the documentation.
> [Lisk Core API 1.0](https://lisk.io/documentation/lisk-core/user-guide/api/1-0#/)
>



## `ADD_DELEGATE`
*Attention: required property - publicKey or username*

#### Parameters
secret
publicKey 					string($publicKey) 			Public key to query
multisigAccountPublicKey 	
secondSecret
username 					string($username) 			Delegate username to query



## `ADD_TRANSACTIONS`
Submits signed transaction object for processing by the transaction pool. 
Transaction objects can be generated locally either by using Lisk Commander or with Lisk Elements.

#### Parameters
transaction *  			(body)				Transaction object to submit to the network
[postTransaction](https://lisk.io/documentation/lisk-core/user-guide/api/1-0#/Transactions/postTransaction)



## `GET_ACCOUNT`
*Attention: required property - address or publicKey*
Search for matching account in the system.

#### Parameters
address 			string($address) 			Address of an account
publicKey 			string($publicKey) 			Public key to query



## `GET_BALANCE`
Return the account balance by address

#### Parameters
address 		string($address) 		Address of an account



## `GET_BLOCK`
Search for a specified block in the system.

#### Parameters
id				string($id)				Block id to query



## `GET_BLOCKS_COUNT`
Return blocks count

#### Parameters
No parameters



## `GET_BLOCKS`
Search for a specified block in the system.

#### Parameters
blockId				string($id)				Block id to query
height 				integer($int32) 		Current height of the network
limit 				integer($int32)			Limit applied to results (Default value : 10)
offset				integer($int32) 		Offset value for results (Default value : 0)
generatorPublicKey	string($publicKey)  	Public key of the forger of the block
sort				string					Fields to sort results by (Available values : height:asc, height:desc, totalAmount:asc, totalAmount:desc, totalFee:asc, totalFee:desc, timestamp:asc, timestamp:desc) (Default value : height:desc)



## `GET_BROADHASH`

#### Parameters



## `GET_DELEGATE`
*Attention: publicKey or username is required*

#### Parameters
publicKey 			string($publicKey) 			Public key to query
username 			string($username) 			Delegate username to query



## `GET_DELEGATES`
Search for a specified delegate in the system.

#### Parameters
address 			string($address) 			Address of an account
publicKey 			string($publicKey) 			Public key to query
secondPublicKey 	string($publicKey) 			Second public key to query
username 			string($username) 			Delegate username to query
offset 				integer($int32) 			Offset value for results (Default value : 0)
limit 				integer($int32) 			Limit applied to results (Default value : 10)
search 				string						Fuzzy delegate username to query
sort 				string						Fields to sort results by (Available values : username:asc, username:desc, rank:asc, rank:desc, productivity:asc, productivity:desc, missedBlocks:asc, missedBlocks:desc, producedBlocks:asc, producedBlocks:desc) (Default value : rank:asc)



## `GET_EPOCH`


#### Parameters



## `GET_FEE`

#### Parameters



## `GET_FEES`

#### Parameters



## `GET_FORGED_BY_ACCOUNT`

#### Parameters



## `GET_FORGING_STATUS`

#### Parameters



## `GET_HEIGHT`

#### Parameters



## `GET_MILESTONE`

#### Parameters



## `GET_NETHASH`

#### Parameters



## `GET_NEXT_FORGERS`

#### Parameters



## `GET_PEER`

#### Parameters



## `GET_PEERS`
Search for specified peers.

#### Parameters
ip 						string($ip) 			IP of the node or delegate
httpPort 				integer($int32) 		Http port of the node or delegate
wsPort 					integer($int32) 		Web socket port for the node or delegate
os 						string 					OS of the node
version 				string($version) 		Lisk version of the node
state 					integer($int32) 		Current state of the network
height 					integer($int32) 		Current height of the network
broadhash 				string($hex) 			Broadhash of the network
limit 					integer($int32) 		Limit applied to results (Default value : 10)
offset 					integer($int32) 		Offset value for results (Default value : 0)
sort 					string 					Fields to sort results by (Available values : height:asc, height:desc, version:asc, version:desc) (Default value : height:desc)



## `GET_PUBLICKEY`

#### Parameters
address 				string($address) 			Address of an account


## `GET_REWARD`

#### Parameters



## `GET_STATUS`
Returns all current status data of the node, e.g. height and broadhash.

#### Parameters
No parameters



## `GET_SUPPLY`

#### Parameters



## `GET_TRANSACTION`
Search transaction by id in the system.

#### Parameters
id*						string($id) 				Transaction id to query



## `GET_TRANSACTIONS`
Search for a specified transaction in the system.

#### Parameters
id 						string($id) 				Transaction id to query
recipientId 			string($address) 			Recipient lisk address
recipientPublicKey  	string($publicKey) 			Recipient public key
senderId 				string($address) 			Sender lisk address
senderPublicKey 		string($publicKey) 			Sender public key
senderIdOrRecipientId 	string($address) 			Lisk address
type 					integer 					Transaction type (0-7)
height  				integer($int32) 			Current height of the network
minAmount 				integer 					Minimum transaction amount in Beddows
maxAmount 				integer 					Maximum transaction amount in Beddows
fromTimestamp  			integer 					Starting unix timestamp
toTimestamp 			integer 					Ending unix timestamp
blockId 				string($id) 				Block id to query
limit 					integer($int32) 			Limit applied to results (Default value : 10)
offset 					integer($int32) 			Offset value for results (Default value : 0)
sort 					string 						Fields to sort results by (Available values : amount:asc, amount:desc, fee:asc, fee:desc, type:asc, type:desc, timestamp:asc, timestamp:desc) (Default value : amount:asc)



## `GET_VOTERS`
*Attention: At least one of the filter parameters must be provided.*
Returns all votes received by a delegate.

#### Parameters
username 				string($username) 			Delegate username to query
address 				string($address) 			Address of an account
publicKey 				string($publicKey) 			Public key to query
secondPublicKey 		string($publicKey) 			Second public key to query
offset 					integer($int32) 			Offset value for results (Default value : 0)
limit 					integer($int32) 			Limit applied to results (Default value : 10)
sort 					string 						Fields to sort results by (Available values : publicKey:asc, publicKey:desc, balance:asc, balance:desc, username:asc, username:desc) )(Default value : publicKey:asc)



## `SEARCH`
Search a delegate

#### Parameters
orderBy
limit


## `SET_ACCOUNT_AND_GET`
Validates input address and calls logic.account.set() and logic.account.get().

#### Parameters
address 				string($address) 			Address of an account
publicKey 				string($publicKey) 			Public key to query



