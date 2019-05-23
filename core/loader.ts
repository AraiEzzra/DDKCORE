import * as path from 'path';
import db from 'shared/driver/db';
import { QueryFile } from 'pg-promise';
import TransactionDispatcher from 'core/service/transaction';
import AccountRepo from 'core/repository/account';
import { IAsset, Transaction } from 'shared/model/transaction';
import { messageON } from 'shared/util/bus';
import { initControllers, initShedulers } from 'core/controller';
import config, { NODE_ENV_ENUM } from 'shared/config';
import BlockPGRepository from 'core/repository/block/pg';
import BlockRepository from 'core/repository/block';
import BlockService from 'core/service/block';
import socket from 'core/repository/socket';
import { logger } from 'shared/util/logger';
import { Block } from 'shared/model/block';
import { socketRPCServer } from 'core/api/server';
import { getAddressByPublicKey } from 'shared/util/account';
import { getRandomInt } from 'shared/util/util';
import System from 'core/repository/system';
import RoundService from 'core/service/round';
import SlotService from 'core/service/slot';
import RoundRepository from 'core/repository/round';
import { getLastSlotNumberInRound } from 'core/util/round';
import { MIN_ROUND_BLOCK } from 'core/util/block';
import { getFirstSlotNumberInRound } from 'core/util/slot';
import DelegateRepository from 'core/repository/delegate';
import { ActionTypes } from 'core/util/actionTypes';

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

class Loader {
    private limit = 1000;

    public async start() {
        logger.debug('LOADER START');
        const historyState = config.CORE.IS_HISTORY;
        if (!config.CORE.IS_HISTORY_ON_WARMUP) {
            config.CORE.IS_HISTORY = false;
        }

        await this.initDatabase();

        initControllers();
        System.synchronization = true;
        await this.blockWarmUp(this.limit);
        if (!BlockRepository.getGenesisBlock()) {
            const result = await BlockService.applyGenesisBlock(config.GENESIS_BLOCK);
            if (!result.success) {
                logger.error(`[Loader] Unable to apply genesis block. ${result.errors.join('. ')}`);
                process.exit(1);
            }
        }
        if (!config.CORE.IS_HISTORY_ON_WARMUP) {
            config.CORE.IS_HISTORY = historyState;
        }
        socket.init();

        initShedulers();

        setInterval(
            () => messageON(ActionTypes.EMIT_REBOOT_PEERS_CONNECTIONS),
            getRandomInt(
                config.CONSTANTS.PEER_CONNECTION_TIME_INTERVAL_REBOOT.MIN,
                config.CONSTANTS.PEER_CONNECTION_TIME_INTERVAL_REBOOT.MAX
            )
        );
        setTimeout(() => messageON('EMIT_SYNC_BLOCKS'), config.CONSTANTS.TIMEOUT_START_SYNC_BLOCKS);
        socketRPCServer.run();
    }

    public async initDatabase() {
        const pathMockData: string = path.join(process.cwd(), 'core/database/sql');
        const filePath = path.join(pathMockData, 'init.sql');
        await db.query(new QueryFile(filePath, { minify: true }));
    }

    private async blockWarmUp(limit: number) {
        let offset: number = 0;
        do {
            const blockBatch: Array<Block> = await BlockPGRepository.getMany(limit, offset);

            if (!blockBatch) {
                break;
            }

            for (const block of blockBatch) {

                if (block.height === 1) {
                    BlockRepository.add(block);
                    this.transactionsWarmUp(block.transactions);
                }

                if (block.height === MIN_ROUND_BLOCK) {
                    const newRound = RoundService.generate(
                        getFirstSlotNumberInRound(
                            block.createdAt,
                            DelegateRepository.getActiveDelegates().length,
                        ),
                    );

                    RoundRepository.add(newRound);
                }

                if (block.height >= MIN_ROUND_BLOCK) {
                    RoundService.restoreToSlot(SlotService.getSlotNumber(block.createdAt));

                    this.transactionsWarmUp(block.transactions);
                    BlockRepository.add(block);

                    const currentRound = RoundRepository.getCurrentRound();
                    currentRound.slots[block.generatorPublicKey].isForged = true;
                }
            }

            if (blockBatch.length < limit) {
                break;
            }
            offset += limit;
        } while (true);
    }

    private transactionsWarmUp(transactions: Array<Transaction<IAsset>>): void {
        for (const trs of transactions) {
            let sender = AccountRepo.getByAddress(getAddressByPublicKey(trs.senderPublicKey));
            if (!sender) {
                sender = AccountRepo.add({
                    address: trs.senderAddress,
                    publicKey: trs.senderPublicKey
                });
            } else if (!sender.publicKey) {
                sender.publicKey = trs.senderPublicKey;
            }

            TransactionDispatcher.applyUnconfirmed(trs, sender);
        }
    }
}

export default new Loader();
