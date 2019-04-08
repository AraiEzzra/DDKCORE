import * as path from 'path';
import db from 'shared/driver/db';
import { QueryFile } from 'pg-promise';
import TransactionDispatcher from 'core/service/transaction';
import AccountRepo from 'core/repository/account';
import { IAsset, Transaction } from 'shared/model/transaction';
import { messageON } from 'shared/util/bus';
import { initControllers, initShedulers } from 'core/controller';
import config from 'shared/config';
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
import { getLastSlotInRound } from 'core/util/round';
import { MIN_ROUND_BLOCK } from 'core/util/block';

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

class Loader {
    private limit = 1000;

    public async start() {
        logger.debug('LOADER START');
        await this.initDatabase();

        initControllers();
        await this.blockWarmUp(this.limit);
        if (!BlockRepository.getGenesisBlock()) {
            await BlockService.applyGenesisBlock(config.GENESIS_BLOCK);
        }

        socket.init();

        initShedulers();

        setInterval(
            () => messageON('EMIT_REBOOT_PEERS_CONNECTIONS'),
            getRandomInt(
                config.CONSTANTS.PEER_CONNECTION_TIME_INTERVAL_REBOOT.MIN,
                config.CONSTANTS.PEER_CONNECTION_TIME_INTERVAL_REBOOT.MAX
            )
        );
        setTimeout(
            () => {
                if (!System.synchronization) {
                    messageON('EMIT_SYNC_BLOCKS');
                }
            },
            config.CONSTANTS.TIMEOUT_START_SYNC_BLOCKS
        );
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
                    const newRound = RoundService.generate(SlotService.getSlotNumber(block.createdAt));
                    RoundRepository.add(newRound);
                }

                if (block.height >= MIN_ROUND_BLOCK) {
                    const lastSlotInRound = getLastSlotInRound(RoundRepository.getCurrentRound());
                    const blockSlotNumber = SlotService.getSlotNumber(block.createdAt);
                    if (lastSlotInRound === blockSlotNumber) {
                        RoundService.processReward(RoundRepository.getCurrentRound());
                        const newRound = RoundService.generate(blockSlotNumber);
                        RoundRepository.add(newRound);
                    }

                    BlockRepository.add(block);
                    this.transactionsWarmUp(block.transactions);

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
