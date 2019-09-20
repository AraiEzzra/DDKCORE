import TransactionController from 'core/controller/transaction';
import { expect } from 'chai';
import { Transaction } from 'shared/model/transaction';
import {
    TransactionSend,
    TransactionRegister,
    senderAddress,
    recipientAddress, amount
} from 'test/lab/test/transaction/mock';
import AccountRepository from 'core/repository/account';
import TransactionDispatcher from 'core/service/transaction';
import BlockRepo from 'core/repository/block/index';
import { DEFAULT_TEST_TIMEOUT, NODE_NAME } from 'test/lab/config';
import { TestRunner } from 'test/lab/runner';
import { preparePeerNode } from 'test/lab/runner/preparer/peerPreparator';
import { CUSTOM_CONFIG, PEER } from 'test/lab/runner/preparer/config';
import PeerController from 'core/controller/peer';
import { TEST_RUNNER_NAME } from 'test/lab/utils/constants';
import PeerService from 'core/service/peer';

const TEST_NAME = 'TEST_TRANSACTION_APPLY';
const TEST_DONE_STAGE_1 = 'TEST_TRANSACTION_APPLY_UNCONFIRMED';
const TEST_DONE_STAGE_2 = 'TEST_TRANSACTION_UNDO_UNCONFIRMED';
const TEST_AFTER_STAGE_NAME = 'TEST_TRANSACTION_APPLY_AFTER';

describe('TRANSACTION APPLY', function () {
    this.timeout(DEFAULT_TEST_TIMEOUT);

    const testRunner = new TestRunner(
        TEST_NAME,
        preparePeerNode({ customConfig: CUSTOM_CONFIG, trustedPeers: [] }),
        preparePeerNode({ customConfig: CUSTOM_CONFIG, trustedPeers: [] }),
        preparePeerNode({ customConfig: CUSTOM_CONFIG, trustedPeers: [] })
    );

    before(async () => {
        await testRunner.preparer.prepare();
        if (NODE_NAME === TEST_RUNNER_NAME) {
            TransactionController.onReceiveTransaction({
                    data: {
                        trs: TransactionRegister
                    }, peerAddress: {}
                }
            );
            TransactionController.onReceiveTransaction({
                    data: {
                        trs: TransactionSend
                    }, peerAddress: {}
                }
            );
        }
    });

    it('Check apply unconfirmed', async () => {
        PeerController.init();


        if (NODE_NAME === TEST_RUNNER_NAME) {

            for (let i = 0; i < 5; i++) {
                TransactionDispatcher.applyUnconfirmed(
                    new Transaction(TransactionSend),
                    AccountRepository.getByAddress(senderAddress)
                );
            }
            console.log(AccountRepository.getByAddress(recipientAddress).actualBalance);
            expect(AccountRepository.getByAddress(recipientAddress).actualBalance).to.equal(amount);
        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_1);
    });
    it('Check undo unconfirmed', async () => {

        if (NODE_NAME === TEST_RUNNER_NAME) {
            for (let i = 0; i < 3; i++) {
                TransactionDispatcher.undoUnconfirmed(
                    new Transaction(TransactionSend),
                    AccountRepository.getByAddress(senderAddress)
                );
            }
            console.log(AccountRepository.getByAddress(recipientAddress).actualBalance);
            expect(AccountRepository.getByAddress(recipientAddress).actualBalance).to.equal(0);
        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_2);
    });

    after(async () => {
        PeerService.removeAll();
        this.timeout(DEFAULT_TEST_TIMEOUT);
        await testRunner.synchronizer.syncAll(TEST_AFTER_STAGE_NAME);
        console.log('AFTER TEST CLEANUP COMPLETED!');
    });
});
