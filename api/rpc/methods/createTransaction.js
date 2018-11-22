const { createServerRPCMethod, validator } = require('./../util');
const speakeasy = require('speakeasy');
const { ReservedErrorCodes } = require('./../errors');
const { addTransactions } = require('../../../schema/transactions');
const crypto = require('crypto');

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

      scope.modules.accounts.shared.getAccount({body: {address: params.address}}, async (error, result) => {
        const sender = result.account;
        const hash = crypto.createHash('sha256').update(sender.publicKey, 'utf8').digest();
        const keypair = scope.ed.makeKeypair(hash);
        let trx;

        try {
          trx = await scope.logic.transaction.create({
            type: 0,
            sender: sender,
            keypair: keypair
          });
        } catch (e) { }

        resolve(error ? {error} : trx);

      });
    });
  });
