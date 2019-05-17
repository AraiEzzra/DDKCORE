import Loader from 'core/loader';
import { logger } from 'shared/util/logger';
import TransactionPool from 'core/service/transactionPool';
import TransactionQueue from 'core/service/transactionQueue';
import config from 'shared/config';

const preconfiguration: Array<Promise<any>> = [];

preconfiguration.push(Loader.start());

setInterval(() => {
    logger.debug(
        `[Server] Queue size: ${TransactionQueue.getSize().queue}, ` +
        `conflicred queue size: ${TransactionQueue.getSize().conflictedQueue}, ` +
        `pool size: ${TransactionPool.getSize()}`
    );
}, config.CONSTANTS.UPDATE_BLOCKCHAIN_INFO_INTERVAL);

Promise.all(preconfiguration)
    .then(() => {})
    .catch(err => {
        logger.error('Failed to start the server CORE. \n', err);
    });
