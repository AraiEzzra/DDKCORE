/*eslint*/

let node = require('../../node.js');
let ed = require('../../../helpers/ed');
let bignum = require('../../../helpers/bignum.js');
let crypto = require('crypto');
let async = require('async');

let chai = require('chai');
let expect = require('chai').expect;
let _ = require('lodash');
let transactionTypes = require('../../../helpers/transactionTypes');

let modulesLoader = require('../../common/initModule').modulesLoader;
let TransactionLogic = require('../../../logic/transaction.js');
let Transfer = require('../../../logic/transfer.js');
let Rounds = require('../../../modules/rounds.js');
let AccountLogic = require('../../../logic/account.js');
let AccountModule = require('../../../modules/accounts.js');
let DelegateModule = require('../../../modules/delegates.js');

let validPassword = 'robust weapon course unknown head trial pencil latin acid';
let validKeypair = ed.makeKeypair(crypto.createHash('sha256').update(validPassword, 'utf8').digest());

let senderHash = crypto.createHash('sha256').update(node.gAccount.password, 'utf8').digest();
let senderKeypair = ed.makeKeypair(senderHash);

let validSender = {
    username: null,
    isDelegate: 0,
    secondSignature: 0,
    address: '16313739661670634666L',
    publicKey: 'c094ebee7ec0c50ebee32918655e089f6e1a604b83bcaa760293c61e0f18ab6f',
    secondPublicKey: null,
    balance: 9850458911801508,
    u_balance: 9850458911801508,
    vote: 0,
    multisignatures: null,
    multimin: 0,
    multilifetime: 0,
    blockId: '8505659485551877884',
    nameexist: 0,
    producedblocks: 0,
    missedblocks: 0,
    fees: 0,
    rewards: 0,
    virgin: 0
};

let validTransactionData = {
    type: 0,
    amount: 8067474861277,
    sender: validSender,
    senderId: '16313739661670634666L',
    recipientId: '2460251951231579923L',
    fee: 10000000,
    keypair: senderKeypair,
    publicKey: 'c094ebee7ec0c50ebee32918655e089f6e1a604b83bcaa760293c61e0f18ab6f',
};

let validTransaction = {
    id: '16140284222734558289',
    rowId: 133,
    blockId: '1462190441827192029',
    type: 0,
    timestamp: 33363661,
    senderPublicKey: 'c094ebee7ec0c50ebee32918655e089f6e1a604b83bcaa760293c61e0f18ab6f',
    senderId: '16313739661670634666L',
    recipientId: '2460251951231579923L',
    amount: 8067474861277,
    fee: 10000000,
    signature: '0c5e9ed74fc64ca5940a45025f7386fc40cc7f495ca48490d2c7e9fb636cbe8046e1a5ce031ff5d84f7bf753f9e4307c6c3dedcc9756844177093dd46ccade06',
    signSignature: null,
    requesterPublicKey: null,
    signatures: null,
    asset: {},
};

let rawValidTransaction = {
    t_id: '16140284222734558289',
    b_height: 981,
    t_blockId: '1462190441827192029',
    t_type: 0,
    t_timestamp: 33363661,
    t_senderPublicKey: 'c094ebee7ec0c50ebee32918655e089f6e1a604b83bcaa760293c61e0f18ab6f',
    m_recipientPublicKey: null,
    t_senderId: '16313739661670634666L',
    t_recipientId: '2460251951231579923L',
    t_amount: 8067474861277,
    t_fee: 10000000,
    t_signature: '0c5e9ed74fc64ca5940a45025f7386fc40cc7f495ca48490d2c7e9fb636cbe8046e1a5ce031ff5d84f7bf753f9e4307c6c3dedcc9756844177093dd46ccade06',
    confirmations: 8343
};


describe('transfer', function () {
    let transfer;
    let transaction;
    let transferBindings;
    let accountModule;

    before(function (done) {
        async.auto({
            rounds: function (cb) {
                modulesLoader.initModule(Rounds, modulesLoader.scope, cb);
            },
            accountLogic: function (cb) {
                modulesLoader.initLogicWithDb(AccountLogic, cb, {});
            },
            transactionLogic: ['rounds', 'accountLogic', function (result, cb) {
                modulesLoader.initLogicWithDb(TransactionLogic, function (err, __transaction) {
                    __transaction.bindModules(result.rounds);
                    cb(err, __transaction);
                }, {
                    ed: require('../../../helpers/ed'),
                    account: result.account
                });
            }],
            accountModule: ['accountLogic', 'transactionLogic', function (result, cb) {
                modulesLoader.initModuleWithDb(AccountModule, cb, {
                    logic: {
                        account: result.accountLogic,
                        transaction: result.transactionLogic
                    }
                });
            }]
        }, function (err, result) {
            expect(err).to.not.exist;
            transfer = new Transfer();
            transferBindings = {
                account: result.accountModule,
                rounds: result.rounds
            };
            transfer.bind(result.accountModule, result.rounds);
            transaction = result.transactionLogic;
            transaction.attachAssetType(transactionTypes.SEND, transfer);
            accountModule = result.accountModule;

            done();
        });
    });

    describe('bind', function () {
        it('should be okay with correct params', function () {
            expect(function () {
                transfer.bind(transferBindings.account, transferBindings.rounds);
            }).to.not.throw();
        });

        after(function () {
            transfer.bind(transferBindings.account, transferBindings.rounds);
        });
    });

    describe('create', function () {
        it('should throw with empty parameters', function () {
            expect(function () {
                transfer.create();
            }).to.throw();
        });

        it('should be okay with valid parameters', function () {
            expect(transfer.create(validTransactionData, validTransaction)).to.be.an('object');
        });
    });

    describe('calculateFee', function () {
        it('should return the correct fee', function () {
            expect(transfer.calculateFee()).to.equal(node.constants.fees.send);
        });
    });

    describe('verify', function () {
        it('should return error if recipientId is not set', function (done) {
            let trs = _.cloneDeep(validTransaction);
            delete trs.recipientId;
            transfer.verify(trs, validSender, function (err) {
                expect(err).to.equal('Missing recipient');
                done();
            });
        });

        it('should return error if amount is less than 0', function (done) {
            let trs = _.cloneDeep(validTransaction);
            trs.amount = -10;

            transfer.verify(trs, validSender, function (err) {
                expect(err).to.equal('Invalid transaction amount');
                done();
            });
        });

        it('should verify okay for valid transaction', function (done) {
            transfer.verify(validTransaction, validSender, done);
        });
    });

    describe('process', function () {
        it('should be okay', function (done) {
            transfer.process(validTransaction, validSender, done);
        });
    });

    describe('getBytes', function () {
        it('should be okay', function () {
            expect(transfer.getBytes(validTransaction)).to.eql(null);
        });
    });

    describe('apply', function () {
        let dummyBlock = {
            id: '9314232245035524467',
            height: 1
        };

        function undoTransaction(trs, sender, done) {
            transfer.undo.call(transaction, trs, dummyBlock, sender, done);
        }

        it('should return error if recipientid is not set', function (done) {
            let trs = _.cloneDeep(validTransaction);
            delete trs.recipientId;
            transfer.apply.call(transaction, trs, dummyBlock, validSender, function (err) {
                expect(err).to.equal('Invalid public key');
                done();
            });
        });

        it('should be okay for a valid transaction', function (done) {
            accountModule.getAccount({ address: validTransaction.recipientId }, function (err, accountBefore) {
                expect(err).to.not.exist;
                expect(accountBefore).to.exist;

                let amount = new bignum(validTransaction.amount.toString());
                let balanceBefore = new bignum(accountBefore.balance.toString());

                transfer.apply.call(transaction, validTransaction, dummyBlock, validSender, function (err) {
                    expect(err).to.not.exist;

                    accountModule.getAccount({ address: validTransaction.recipientId }, function (err, accountAfter) {
                        expect(err).to.not.exist;
                        expect(accountAfter).to.exist;

                        let balanceAfter = new bignum(accountAfter.balance.toString());
                        expect(balanceBefore.plus(amount).toString()).to.equal(balanceAfter.toString());
                        undoTransaction(validTransaction, validSender, done);
                    });
                });
            });
        });
    });

    describe('undo', function () {
        let dummyBlock = {
            id: '9314232245035524467',
            height: 1
        };

        function applyTransaction(trs, sender, done) {
            transfer.apply.call(transaction, trs, dummyBlock, sender, done);
        }

        it('should return error if recipientid is not set', function (done) {
            let trs = _.cloneDeep(validTransaction);
            delete trs.recipientId;
            transfer.undo.call(transaction, trs, dummyBlock, validSender, function (err) {
                expect(err).to.equal('Invalid public key');
                done();
            });
        });

        it('should be okay for a valid transaction', function (done) {
            accountModule.getAccount({ address: validTransaction.recipientId }, function (err, accountBefore) {
                expect(err).to.not.exist;

                let amount = new bignum(validTransaction.amount.toString());
                let balanceBefore = new bignum(accountBefore.balance.toString());

                transfer.undo.call(transaction, validTransaction, dummyBlock, validSender, function (err) {
                    expect(err).to.not.exist;

                    accountModule.getAccount({ address: validTransaction.recipientId }, function (err, accountAfter) {
                        expect(err).to.not.exist;

                        let balanceAfter = new bignum(accountAfter.balance.toString());
                        expect(balanceAfter.plus(amount).toString()).to.equal(balanceBefore.toString());
                        applyTransaction(validTransaction, validSender, done);
                    });
                });
            });
        });
    });

    describe('applyUnconfirmed', function () {

        it('should be okay with valid params', function (done) {
            transfer.applyUnconfirmed.call(transaction, validTransaction, validSender, done);
        });
    });

    describe('undoUnconfirmed', function () {

        it('should be okay with valid params', function (done) {
            transfer.undoUnconfirmed.call(transaction, validTransaction, validSender, done);
        });
    });

    describe('objectNormalize', function () {
        it('should remove blockId from trs', function () {
            let trs = _.cloneDeep(validTransaction);
            trs.blockId = '9314232245035524467';
            expect(transfer.objectNormalize(trs)).to.not.have.key('blockId');
        });
    });

    describe('dbRead', function () {
        it('should be okay', function () {
            expect(transfer.dbRead(validTransaction)).to.eql(null);
        });
    });

    describe('dbSave', function () {
        it('should be okay', function () {
            expect(transfer.dbRead(validTransaction)).to.eql(null);
        });
    });

    describe('ready', function () {
        it('should return true for single signature trs', function () {
            expect(transfer.ready(validTransaction, validSender)).to.equal(true);
        });

        it('should return false for multi signature transaction with less signatures', function () {
            let trs = _.cloneDeep(validTransaction);
            let vs = _.cloneDeep(validSender);
            vs.multisignatures = [validKeypair.publicKey.toString('hex')];
            expect(transaction.ready(trs, vs)).to.equal(false);
        });

        it('should return true for multi signature transaction with alteast min signatures', function () {
            let trs = _.cloneDeep(validTransaction);
            let vs = _.cloneDeep(validSender);
            vs.multisignatures = [validKeypair.publicKey.toString('hex')];
            vs.multimin = 1;
            delete trs.signature;
            trs.signature = transaction.sign(senderKeypair, trs);
            trs.signatures = [transaction.multisign(validKeypair, trs)];
            expect(transaction.ready(trs, vs)).to.equal(true);
        });
    });
});
