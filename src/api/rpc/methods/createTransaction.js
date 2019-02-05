const { createServerRPCMethod, schemaValidator } = require('../util');
const ReservedError = require('../errors');
const crypto = require('crypto');
const transactionTypes = require('../../../helpers/transactionTypes.js');


module.exports = createServerRPCMethod(
    'CREATE_TRANSACTION',

    /**
     * @param {WebSocketServer} wss
     * @param {object} params
     * @param {object} scope - Application instance
     */
    (wss, params, scope) => new Promise((resolve) => {

        if (!transactionTypes[params.type]) {
            resolve({error: `Unknown transaction type [${params.type}]`});
            return;
        }

        scope.modules.accounts.shared.getAccount({ body: { address: params.senderAddress } }, async (error, senderAccount) => {
            if (error || !senderAccount.account || !senderAccount.account.publicKey) {
                resolve({error: error || `Incorrect sender account ${params.senderAddress}`});
                return;
            }

            const hash = crypto.createHash('sha256').update(senderAccount.account.publicKey, 'utf8').digest();
            const keypair = scope.ed.makeKeypair(hash);

            const createTransaction = async (sender, requester) => {
                let transaction;
                let error;
                try {
                    transaction = await scope.logic.transaction.create({
                        type: transactionTypes[params.type],
                        amount: params.amount,
                        sender,
                        requester,
                        keypair,
                    });
                } catch (err) {
                    error = err.message;
                }
                resolve(error ? {error} : {transaction} );
            };

            if (params.requesterAddress) {
                scope.modules.accounts.shared.getAccount({ body: { address: params.requesterAddress } },
                    async (error, requesterAccount) => {
                        if (error) {
                            resolve({error});
                            return;
                        }
                        await createTransaction(senderAccount.account, requesterAccount.account);
                    });
            } else {
                await createTransaction(senderAccount.account);
            }
        });

    })
);
