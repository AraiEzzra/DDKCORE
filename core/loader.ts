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
import RoundService from 'core/service/round';
import BlockService from 'core/service/block';
import RoundRepository from 'core/repository/round';
import socket from 'core/repository/socket';
const START_SYNC_BLOCKS = 15000;

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

class Loader {
    private limit = 1000;

    public async start() {
        const pathMockData: string = path.join(process.cwd(), 'core/database/sql');
        const filePath = path.join(pathMockData, 'init.sql');
        await db.query(new QueryFile(filePath, { minify: true }));
        await BlockService.applyGenesisBlock(config.genesisBlock, false, true);
        await this.transactionWarmUp(this.limit);
        await this.roundWarmUp(this.limit);
        initControllers();
        messageON('WARM_UP_FINISHED', null);
        socket.init();
        setTimeout(
            () => messageON('EMIT_SYNC_BLOCKS', {}),
            START_SYNC_BLOCKS
        );
    }

    private async transactionWarmUp(limit: number) {
        let offset = 0;
        do {
            const transactionBatch: Array<Transaction<IAsset>> =
                await TransactionPGRepo.getMany(limit, offset);

            for (let trs of transactionBatch) {
                const sender = AccountRepo.add({
                    address: trs.senderAddress,
                    publicKey: trs.senderPublicKey
                });
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
            const roundsBatch: Array<Round> = await RoundPGRepository.getMany(offset);

            if (!roundsBatch) {
                break;
            }

            for (let round of roundsBatch) {
                RoundRepository.setCurrentRound(round);
                const data = RoundService.sumRound(round);
                RoundService.applyUnconfirmed(data);
                RoundRepository.setPrevRound(round);
            }

            if (roundsBatch.length < limit) {
                break;
            }
            offset += limit;
        } while (true);
    }
}

export default new Loader();
