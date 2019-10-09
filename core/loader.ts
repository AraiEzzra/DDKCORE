import * as path from 'path';
import { QueryFile } from 'pg-promise';

import db from 'shared/driver/db';
import TransactionDispatcher from 'core/service/transaction';
import AccountRepo from 'core/repository/account';
import { IAsset, Transaction } from 'shared/model/transaction';
import { messageON } from 'shared/util/bus';
import { initControllers, initShedulers } from 'core/controller';
import config from 'shared/config';
import BlockPGRepository from 'core/repository/block/pg';
import BlockStorageService from 'core/service/blockStorage';
import BlockService from 'core/service/block';
import SocketDriver from 'core/driver/socket/index';
import { logger } from 'shared/util/logger';
import { socketRPCServer } from 'core/api/server';
import { getAddressByPublicKey } from 'shared/util/account';
import { getRandomInt } from 'shared/util/util';
import System from 'core/repository/system';
import RoundService from 'core/service/round';
import SlotService from 'core/service/slot';
import RoundRepository from 'core/repository/round';
import { MIN_ROUND_BLOCK_HEIGHT } from 'core/util/block';
import { getFirstSlotNumberInRound } from 'core/util/slot';
import DelegateService from 'core/service/delegate';
import { ActionTypes } from 'core/util/actionTypes';
import { Migrator } from 'core/database/migrator';
import { ERROR_CODES } from 'shared/config/errorCodes';

const http = require('http');
const heapdump = require('heapdump');

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
        await new Migrator(db).run();

        initControllers();
        System.synchronization = true;
        await this.blockWarmUp(this.limit);
        if (!BlockStorageService.getGenesis()) {
            const result = await BlockService.applyGenesisBlock(config.GENESIS_BLOCK);
            if (!result.success) {
                logger.error(`[Loader] Unable to apply genesis block. ${result.errors.join('. ')}`);
                process.exit(1);
            }
        }

        const requestLogs = [];
        const server = http.createServer((req, res) => {
            if (req.url === '/heapdump') {
                heapdump.writeSnapshot((err, filename) => {
                    if (err) {
                        console.log(err);
                    }

                    console.log('Heap dump written to', filename)
                });
            }

            requestLogs.push({ url: req.url, date: new Date() });
            res.end(JSON.stringify(requestLogs));
        });

        server.listen(3000);
        console.log('Server listening to port 3000. Press Ctrl+C to stop it.');
        console.log(`Heapdump enabled. Run "kill -USR2 ${process.pid}" or send a request to "/heapdump" to generate a heapdump.`);

        // if (!config.CORE.IS_HISTORY_ON_WARMUP) {
        //     config.CORE.IS_HISTORY = historyState;
        // }
        // SocketDriver.initServer();

        // setInterval(() => messageON(ActionTypes.EMIT_PING), config.CONSTANTS.PEER_PING_PONG_INTERVAL);

        // initShedulers();

        // setInterval(
        //     () => messageON(ActionTypes.EMIT_REBOOT_PEERS_CONNECTIONS),
        //     getRandomInt(
        //         config.CONSTANTS.PEER_CONNECTION_TIME_INTERVAL_REBOOT.MIN,
        //         config.CONSTANTS.PEER_CONNECTION_TIME_INTERVAL_REBOOT.MAX,
        //     )
        // );

        // System.synchronization = false;
        // setTimeout(() => messageON(ActionTypes.EMIT_SYNC_BLOCKS), config.CONSTANTS.TIMEOUT_START_SYNC_BLOCKS);
        // socketRPCServer.run();
    }

    public async initDatabase() {
        const pathMockData: string = path.join(process.cwd(), 'core/database/sql');
        const filePath = path.join(pathMockData, 'init.sql');
        await db.query(new QueryFile(filePath, { minify: true }));
    }

    private async blockWarmUp(limit: number) {
        let offset: number = 0;
        do {
            const blocksResponse = await BlockPGRepository.getMany(limit, offset);
            if (!blocksResponse.success) {
                logger.error(blocksResponse.errors.join('. '));
                process.exit(ERROR_CODES.WARMUP_FAILED);
            }

            const blocks = blocksResponse.data;
            for (const block of blocks) {
                if (block.height === 1) {
                    BlockStorageService.push(block);
                    this.transactionsWarmUp(block.transactions);
                }

                if (block.height === MIN_ROUND_BLOCK_HEIGHT) {
                    const newRound = RoundService.generate(
                        getFirstSlotNumberInRound(
                            block.createdAt,
                            DelegateService.getActiveDelegatesCount(),
                        ),
                    );

                    RoundRepository.add(newRound);
                }

                if (block.height >= MIN_ROUND_BLOCK_HEIGHT) {
                    RoundService.restoreToSlot(SlotService.getSlotNumber(block.createdAt));

                    this.transactionsWarmUp(block.transactions);
                    BlockStorageService.push(block);

                    const currentRound = RoundRepository.getCurrentRound();
                    currentRound.slots[block.generatorPublicKey].isForged = true;
                }
            }

            if (blocks.length < limit) {
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
            TransactionDispatcher.apply(trs, sender);
        }
    }
}

export default new Loader();
