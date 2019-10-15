import Loader from 'core/loader';
import { logger } from 'shared/util/logger';

process.addListener('unhandledRejection', reason => {
    logger.error(`[Core][Process][unhandledRejection] `, reason, JSON.stringify(reason));
});

process.addListener('uncaughtException', err => {
    logger.error(`[Core][Process][uncaughtException] ${JSON.stringify(err)}\n${err.stack}`);
});

const preconfiguration: Array<Promise<any>> = [];

preconfiguration.push(Loader.start());

Promise.all(preconfiguration)
    .then(() => {})
    .catch(err => {
        logger.error('Failed to start the server CORE. \n', err);
    });
