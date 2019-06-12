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
import BlockRepository from 'core/repository/block';
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
import { MIN_ROUND_BLOCK } from 'core/util/block';
import { getFirstSlotNumberInRound } from 'core/util/slot';
import DelegateRepository from 'core/repository/delegate';
import { ActionTypes } from 'core/util/actionTypes';
const fs = require("fs");
import { Migrator } from 'core/database/migrator';
import { ERROR_CODES } from 'shared/config/errorCodes';

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

function ConvertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','

            line += array[i][index];
        }

        str += line + '\r\n';
    }

    return str;
}

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
        SocketDriver.initServer();

        initShedulers();

        setInterval(
            () => messageON(ActionTypes.EMIT_REBOOT_PEERS_CONNECTIONS),
            getRandomInt(
                config.CONSTANTS.PEER_CONNECTION_TIME_INTERVAL_REBOOT.MIN,
                config.CONSTANTS.PEER_CONNECTION_TIME_INTERVAL_REBOOT.MAX
            )
        );
        setTimeout(() => messageON(ActionTypes.EMIT_SYNC_BLOCKS), config.CONSTANTS.TIMEOUT_START_SYNC_BLOCKS);
        socketRPCServer.run();
    }

    public async initDatabase() {
        const pathMockData: string = path.join(process.cwd(), 'core/database/sql');
        const filePath = path.join(pathMockData, 'init.sql');
        await db.query(new QueryFile(filePath, { minify: true }));
    }

    private async blockWarmUp(limit: number) {
        let offset: number = 0;

        let lastDate = new Date(0);
        let statistic = {};

        do {
            const blocksResponse = await BlockPGRepository.getMany(limit, offset);
            if (!blocksResponse.success) {
                logger.error(blocksResponse.errors.join('. '));
                process.exit(ERROR_CODES.WARMUP_FAILED);
            }

            const blocks = blocksResponse.data;
            for (const block of blocks) {

                if (lastDate.getTime() === 0) {
                    const realtime3 = SlotService.getRealTime(block.createdAt);
                    lastDate = new Date(realtime3);
                }

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

                const realtime = SlotService.getRealTime(block.createdAt);
                const currentDay = new Date(realtime);
                console.log('currentDay', currentDay.getDay(), currentDay.toISOString());
                console.log('lastDate', lastDate.getDay(), lastDate.toISOString());

                if (currentDay.getDay() !== lastDate.getDay()) {
                    const realtime2 = SlotService.getRealTime(block.createdAt);
                    lastDate = new Date(realtime2);
                    const date = new Date(realtime2);

                    const totalStakedAmount = AccountRepo.getAll().reduce((a, b) => {
                        return a + b.stakes.filter(stake => stake.isActive).reduce((c, d) => {
                            return c + d.amount;
                        }, 0);
                    }, 0);

                    console.log(`totalStakedAmount: ${totalStakedAmount}`);


                    if (totalStakedAmount !== 0) {
                        statistic[date.getTime()] = {
                            time: date.getTime(),
                            date: date.toISOString(),
                            totalStakedAmount: totalStakedAmount / 100000000,
                        };

                    }
                }
            }

            if (blocks.length < limit) {
                break;
            }
            offset += limit;


            // if (offset > 19000) {
            //     break;
            // }
        } while (true);

        var csv = ConvertToCSV(JSON.stringify(Object.values(statistic)));

        // console.log('statistic', JSON.stringify(statistic));
        await new Promise((resolve) => {
            fs.writeFile('./logs/8.log', csv, function (error) {
                resolve();
            });
        });

        process.exit(1);
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
