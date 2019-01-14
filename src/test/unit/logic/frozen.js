const { promisify } = require('util');
const chai = require('chai');
const expect = chai.expect;
const Logger = require('../../../logger.js');
const Frozen = require('../../../logic/frozen.js');
const db = require('../../../helpers/database.js');
const ed = require('../../../helpers/ed');

const modulesLoader = require('../../common/initModule').modulesLoader;
const node = require('../../node.js');

const logger = (new Logger()).logger;

const stakeTransaction = {
    type: 8,
    amount: 0,
    senderPublicKey: 'c7b747f11f6275a50d22edaa8f4028a4b774c13548d74904e4c8aff744c01a7d',
    timestamp: 86732751,
    asset: {
        stakeOrder: {
            stakedAmount: 10000000000,
            nextVoteMilestone: 86732751,
            startTime: 86732751
        }
    },
    stakedAmount: 10000000000,
    trsName: 'STAKE',
    groupBonus: 0,
    signature: 'fe517f07cbe1b123b1f9ec2c7730173648c82a831cdae10cccb7ab9c7ecbeaf7b9885fe6f2f847c47b9e87408466db6e77300d370321463bc293d2cd1377d907',
    id: '13675510778049454002',
    fee: 1000000,
    senderId: 'DDK6804971243772580874',
    relays: 1,
    receivedAt: '2018-10-01T13:25:51.106Z',
    blockId: '10307902676404444040'
};


describe('Frozen', function () {

    modulesLoader.scope.config.db.host = '0.0.0.0';
    modulesLoader.scope.config.db.password = 'password';

    let
        transaction = stakeTransaction, // node.randomTxAccount(),
        block,
        sender,
        frozenInstance,
        frozenArguments = {
            logger: logger,
            db: null,
            transaction: transaction,
            network: modulesLoader.scope.network,
            config: modulesLoader.scope.config,
            balancesSequence: {},
            ed: ed
        };

    before(function (done) {

        const createFrozenInstance = (args) => {
            return new Frozen(
                args.logger, args.db, args.transaction, args.network, args.config, args.balancesSequence, args.ed
            );
        };

        db.connect(modulesLoader.scope.config.db, logger, (err, dbi) => {
            frozenArguments.db = dbi;
            frozenInstance = createFrozenInstance(frozenArguments);
            done();
        });

    });


    describe('Test Frozen.apply, operation of "stake"', function () {
        transaction.trsName = 'STAKE';

        it('should return transaction object and check it', function (done) {
            frozenInstance.apply(transaction, block, sender, (error, TRX) => {
                expect(error).to.be.null;

                expect(TRX).to.be.an('object');

                expect(TRX.balance).to.be.equals('0');
                expect(TRX.password).to.be.string;
                expect(TRX.secondPassword).to.be.string;
                expect(TRX.username).to.be.string;
                expect(TRX.publicKey.length).to.be.equals(64);
                expect(TRX.sentAmount).to.be.string;
                expect(TRX.paidFee).to.be.string;
                expect(TRX.totalPaidFee).to.be.string;
                expect(TRX.transactions).to.be.instanceof(Array);
                expect(TRX.trsName).to.be.equals(transaction.trsName);

                done();
            });
        });

    });

    describe('Test Frozen.apply, operation of "unstake"', function () {
        transaction.trsName = 'UNSTAKE';

        it('should return transaction object and check it', function (done) {
            frozenInstance.apply(transaction, block, sender, (error, TRX) => {
                expect(error).to.be.null;

                expect(TRX).to.be.an('object');

                expect(TRX.balance).to.be.equals('0');
                expect(TRX.password).to.be.string;
                expect(TRX.secondPassword).to.be.string;
                expect(TRX.username).to.be.string;
                expect(TRX.publicKey.length).to.be.equals(64);
                expect(TRX.sentAmount).to.be.string;
                expect(TRX.paidFee).to.be.string;
                expect(TRX.totalPaidFee).to.be.string;
                expect(TRX.transactions).to.be.instanceof(Array);
                expect(TRX.trsName).to.be.equals(transaction.trsName);

                done();
            });
        });

    });


    describe('apply test for stake', function () {

        const accounts = {
            secret: 'obvious illness service health witness useful correct brave asthma food install next',
            delegates: ['-3f0348b6d3ecaeaeca0a05ee4c2d7b4b7895ef0a12d8023ba245b6b8022833e5'],
            publicKey: 'c7b747f11f6275a50d22edaa8f4028a4b774c13548d74904e4c8aff744c01a7d'
        };

        const params = accounts;

        before(function (done) {
            node.post('/api/accounts/delegates', params, done);
        });

        it('should', function (done) {
            modulesLoader.scope.modules.accounts.shared.addDelegates({ body: params }, (error, result) => {
                console.log(error, result);
                done();
            });
        });

    });

});
