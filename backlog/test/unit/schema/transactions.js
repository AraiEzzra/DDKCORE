let expect = require('chai').expect;

let node = require('../../node.js');
let ZSchema = require('../../../helpers/z_schema.js');
let schema = require('../../../schema/transactions.js');

let constants = require('../../../helpers/constants.js');
let validator = new ZSchema();

describe('transactions', function () {

    // TODO: Add tests for other transaction schemas
    describe('getTransaction', function () {
        it('tests for schema');
    });

    describe('getPooledTransaction', function () {
        it('tests for schema');
    });

    describe('getPooledTransactions', function () {
        it('tests for schema');
    });

    describe('addTransactions', function () {
        it('tests for schema');
    });

    describe('getTransactions', function () {
        // TODO: Add tests for other schemas properties
        let testBody;

        beforeEach(function () {
            let account1PublicKey = node.ddk.crypto.getKeys(node.randomPassword()).publicKey;
            let account2PublicKey = node.ddk.crypto.getKeys(node.randomPassword()).publicKey;

            testBody = {
                blockId: '1465651642158264047',
                type: 0,
                senderId: '1085993630748340485L',
                senderPublicKey: 'c96dec3595ff6041c3bd28b76b8cf75dce8225173d1bd00241624ee89b50f2a8',
                ownerPublicKey: 'c96dec3595ff6041c3bd28b76b8cf75dce8225173d1bd00241624ee89b50f2a8',
                ownerAddress: '1085993630748340485L',
                recipientId: '16313739661670634666L',
                amount: 100,
                fee: 20,
                senderPublicKeys: [account1PublicKey, account2PublicKey],
                recipientPublicKeys: [account1PublicKey, account2PublicKey],
                senderIds: [node.ddk.crypto.getAddress(account1PublicKey), node.ddk.crypto.getAddress(account2PublicKey)],
                recipientIds: [node.ddk.crypto.getAddress(account1PublicKey), node.ddk.crypto.getAddress(account2PublicKey)],
                fromHeight: 1,
                toHeight: 2,
                fromTimestamp: 0,
                toTimestamp: 2,
                fromUnixTime: constants.epochTime.getTime() / 1000,
                toUnixTime: (constants.epochTime.getTime() / 1000 + 1),
                minAmount: 0,
                maxAmount: 1,
                minConfirmations: 1,
                orderBy: 'username',
                limit: 500,
                offset: 0
            };
        });

        it('should return error when senderPublicKeys is not an array', function () {
            testBody.senderPublicKeys = '';
            validator.validate(testBody, schema.getTransactions);
            expect(validator.getLastErrors().map(function (e) {
                return e.message;
            })).to.eql(['Expected type array but found type string']);
        });

        it('should return error when senderPublicKeys length is less than minimum acceptable length', function () {
            testBody.senderPublicKeys = [];
            validator.validate(testBody, schema.getTransactions);
            expect(validator.getLastErrors().map(function (e) {
                return e.message;
            })).to.eql(['Array is too short (0), minimum 1']);
        });

        it('should return error when recipientPublicKeys is not an array', function () {
            testBody.recipientPublicKeys = '';
            validator.validate(testBody, schema.getTransactions);
            expect(validator.getLastErrors().map(function (e) {
                return e.message;
            })).to.eql(['Expected type array but found type string']);
        });

        it('should return error when recipientPublicKeys length is less than minimum acceptable length', function () {
            testBody.recipientPublicKeys = [];
            validator.validate(testBody, schema.getTransactions);
            expect(validator.getLastErrors().map(function (e) {
                return e.message;
            })).to.eql(['Array is too short (0), minimum 1']);
        });

        it('should return error when recipientIds is not an array', function () {
            testBody.recipientIds = '';
            validator.validate(testBody, schema.getTransactions);
            expect(validator.getLastErrors().map(function (e) {
                return e.message;
            })).to.eql(['Expected type array but found type string']);
        });

        it('should return error when recipientIds length is less than minimum acceptable length', function () {
            testBody.recipientIds = [];
            validator.validate(testBody, schema.getTransactions);
            expect(validator.getLastErrors().map(function (e) {
                return e.message;
            })).to.eql(['Array is too short (0), minimum 1']);
        });

        it('should be ok when params field length valid', function () {
            validator.validate(testBody, schema.getTransactions);
            expect(validator.getLastErrors()).to.not.exist;
        });
    });
});
