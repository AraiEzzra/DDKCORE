import * as path from 'path';
import db from 'shared/driver/db';
import { QueryFile } from 'pg-promise';
import TransactionDispatcher from 'core/service/transaction';
import TransactionPGRepo from 'core/repository/transaction/pg';
import AccountRepo from 'core/repository/account';
import { IAsset, Transaction } from 'shared/model/transaction';
import { messageON } from 'shared/util/bus';
import { initControllers } from 'core/controller';
import config from 'shared/util/config';

import { Round } from 'shared/model/round';
import RoundPGRepository from 'core/repository/round/pg';
import BlockPGRepository from 'core/repository/block/pg';
import BlockRepository from 'core/repository/block';

import RoundService from 'core/service/round';
import BlockService from 'core/service/block';
import RoundRepository from 'core/repository/round';
import socket from 'core/repository/socket';
import { logger } from 'shared/util/logger';
import { Block } from 'shared/model/block';
import { socketRPCServer } from 'core/api/server';
import { getAddressByPublicKey } from 'shared/util/account';

const START_SYNC_BLOCKS = 15000;

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

class Loader {
    private limit = 1000;

    public async start() {
        logger.debug('LOADER START');
        const pathMockData: string = path.join(process.cwd(), 'core/database/sql');
        const filePath = path.join(pathMockData, 'init.sql');
        await db.query(new QueryFile(filePath, { minify: true }));

        initControllers();
        await this.blockWarmUp(this.limit);
        if (!BlockRepository.getGenesisBlock()) {
            await BlockService.applyGenesisBlock(config.genesisBlock);
        } else {
            await this.transactionWarmUp(this.limit);
            await this.roundWarmUp(this.limit);
        }

        socket.init();
        setTimeout(
            () => messageON('EMIT_SYNC_BLOCKS', {}),
            START_SYNC_BLOCKS
        );
        socketRPCServer.run();
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

    private async roundWarmUp(limit) {
        let offset: number = 0;

        do {
            const roundsBatch: Array<Round> = await RoundPGRepository.getMany(limit, offset);

            if (!roundsBatch) {
                break;
            }

            for (const round of roundsBatch) {
                if (round.endHeight) {
                    const data = RoundService.sumRound(round);
                    RoundService.applyUnconfirmed(data);
                }
            }

            if (roundsBatch.length < limit) {
                RoundRepository.setCurrentRound(roundsBatch[roundsBatch.length - 1]);
                if (roundsBatch.length > 1) {
                    RoundRepository.setPrevRound(roundsBatch[roundsBatch.length - 1 - 1]);
                }
                break;
            }
            offset += limit;
        } while (true);
    }

    private async blockWarmUp(limit: number) {
        let offset: number = 0;
        do {
            const blockBatch: Array<Block> = await BlockPGRepository.getMany(offset, limit);

            if (!blockBatch) {
                break;
            }

            for (const block of blockBatch) {
                BlockRepository.add(block);
            }

            if (blockBatch.length < limit) {
                break;
            }
            offset += limit;
        } while (true);

    }
}

export default new Loader();
