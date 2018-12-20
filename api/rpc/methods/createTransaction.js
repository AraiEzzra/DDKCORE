const { createServerRPCMethod, schemaValidator } = require('./../util');
const ReservedError = require('./../errors');
const crypto = require('crypto');
const transactionTypes = require('../../../helpers/transactionTypes.js');

const transactionRequired = [
  'type',
  'amount',
  'senderAddress',
  'requesterAddress',
];

const transactionDefault = {};

module.exports = createServerRPCMethod(

  'CREATE_TRANSACTION',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      const accepted = transactionRequired.every( (key) => params[key] );

      if (Object.keys(transactionTypes).indexOf(params.type) > -1 && accepted ) {
        scope.modules.accounts.shared.getAccount({body: {address: params.senderAddress}}, (error, result) => {

          if (error || (result && result.account)) {
            const sender = result.account;
            const hash = crypto.createHash('sha256').update(sender.publicKey, 'utf8').digest();
            const keypair = scope.ed.makeKeypair(hash);
            let trs;

            scope.modules.accounts.shared.getAccount({body: {address: params.requesterAddress}},
              async (requesterError, requesterResult) => {

                if (requesterResult) {
                  try {
                    const requester = requesterResult.account;
                    trs = await scope.logic.transaction.create({
                      type: transactionTypes[params.type],
                      amount: params.amount,
                      sender: sender,
                      requester: requester,
                      keypair: keypair,
                    });

                    resolve( {transaction: trs} );
                  } catch (err) {
                    resolve( {error: err} );
                  }
                } else {
                  resolve( {error: requesterError} );
                }
              });

          } else {
            resolve( {error} );
          }

        });

      } else {
        resolve( {error: ReservedError.ServerErrorInvalidMethodParameters } );
      }

    });
  });
