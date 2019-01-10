const crypto = require('crypto');
const chai = require('chai');
const expect = require('chai').expect;
const _  = require('lodash');

const node = require('./../../node.js');
const ed = require('../../../helpers/ed.js');
const transactionTypes = require('../../../helpers/transactionTypes');
const constants = require('../../../helpers/constants.js');

const ZSchema = require('../../../helpers/z_schema.js');
const schema = require('../../../schema/signatures.js');
const validator = new ZSchema();

const Logger = require('../../../logger.js');
const logger = (new Logger()).logger;

const SignatureLogic = require('../../../logic/signature.js');
const signatureLogic = new SignatureLogic (schema, logger);

;

// let diff = require('../../../helpers/diff.js');
//
// let modulesLoader = require('../../common/initModule').modulesLoader;
// let TransactionLogic = require('../../../logic/transaction.js');
// let Vote = require('../../../logic/vote.js');
// let Transfer = require('../../../logic/transfer.js');
// let Delegate = require('../../../logic/delegate.js');
// let Rounds = require('../../../modules/rounds.js');
// let AccountLogic = require('../../../logic/account.js');
// let FrozenLogic = require('../../../logic/frozen.js');
// let AccountModule = require('../../../modules/accounts.js');
// let DelegateModule = require('../../../modules/delegates.js');
//
// let validPassword = 'ancient eyebrow pattern twin obtain absent speak bless virus tackle hill equip';
// let validKeypair = ed.makeKeypair(crypto.createHash('sha256').update(validPassword, 'utf8').digest());



describe('Logic/Signature', function () {

  let signatureLogic;
  let bytes;

  before(function (done) {
    signatureLogic = new SignatureLogic (schema, logger);
    done()
  });

  after(function (done) {
    done();
  });

  describe('Checked Signature::getBytes', function () {
    it('should return a buffer bytes', function (done) {

      bytes = signatureLogic.getBytes({
        "type": 10,
        "amount": "100000000000",
        "fee": 0,
        "timestamp": 0,
        "recipientId": "DDK933553974927686133",
        "senderId": "DDK4995063339468361088",
        "senderPublicKey": "f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2",
        "signature": "b306025c137902209f6d68ccc97dcaa09c6636fae7869c6192bb76add6b8bbb2ee317e97be7dc8eab72c0ba567fdb795f93edec3d9eabc2c0ba1029adf94b106",
        "id": "f57bcef5a2af67d2ecea7e2c5833b1035c87680a625bb712963a17775e2de851",
        "stakedAmount": 0,
        "trsName": "SEND"
      });

      console.log(' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> bytes', bytes);

      done();

    });
  });
});















