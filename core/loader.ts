import * as path from 'path';
import db from 'shared/driver/db';
import { QueryFile } from 'pg-promise';
import TransactionDispatcher from 'core/service/transaction';
import TransactionPGRepo from 'core/repository/transaction/pg';
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
        } else {
            await this.transactionWarmUp(this.limit);
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

    private async transactionWarmUp(limit: number) {
        let offset = 0;
        do {
            const transactionBatch: Array<Transaction<IAsset>> =
                await TransactionPGRepo.getMany(limit, offset);

            for (const trs of transactionBatch) {
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
            if (transactionBatch.length < limit) {
                break;
            }
            offset += limit;
        } while (true);

        return;
    }

    private async blockWarmUp(limit: number) {
        let offset: number = 0;
        do {
            const blockBatch: Array<Block> = await BlockPGRepository.getMany(limit, offset);

            if (!blockBatch) {
                break;
            }

            for (const block of blockBatch) {
                BlockRepository.add(block);
                // TODO refactor warmUp
            }

            if (blockBatch.length < limit) {
                break;
            }
            offset += limit;
        } while (true);

    }
}

export default new Loader();
