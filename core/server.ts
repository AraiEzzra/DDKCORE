import Loader from 'core/loader';
import { logger } from 'shared/util/logger';

const preconfiguration: Array<Promise<any>> = [];

preconfiguration.push(Loader.start());

Promise.all(preconfiguration)
    .then(() => {})
    .catch(err => {
        logger.error('Failed to start the server CORE. \n', err);
    });
