const { createServerRPCMethod, validator } = require('./../util');
const { ReservedError } = require('./../errors');
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

  'CREATE_TRANSACTIONS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   * @param {function} cdError - Application Error callback
   */
  function (wss, params, scope, cdError) {
    return new Promise(function (resolve) {
      const accepted = transactionRequired.every( (key) => params[key] );

      if (Object.values(transactionTypes).indexOf(params.type) > -1 && accepted ) {

        scope.modules.accounts.shared.getAccount({body: {address: params.senderAddress}}, async (error, result) => {
          const sender = result.account;
          const hash = crypto.createHash('sha256').update(sender.publicKey, 'utf8').digest();
          const keypair = scope.ed.makeKeypair(hash);

          scope.modules.accounts.shared.getAccount({body: {address: params.requesterAddress}}, async (error, requesterResult) => {
            const requester = requesterResult.account;
            let trs;

            try {
              trs = await scope.logic.transaction.create({
                type: params.type,
                amount: params.amount,
                sender: sender,
                requester: requester,
                keypair: keypair,
              });
            } catch (e) { error = {error: e} }

            resolve(error ? {error} : trs);

          });

        });

      } else {
        resolve( {error: ReservedError.ServerErrorInvalidMethodParameters } );
      }

    });
  });
