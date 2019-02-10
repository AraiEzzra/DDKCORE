import { db } from 'shared/driver';
import { Loader } from './loader';
import { logger } from 'shared/util/logger';

const preconfiguration: Array<Promise<any>> = [];

const loader = new Loader();

preconfiguration.push(loader.runMigrate(db));

Promise.all(preconfiguration)
    .then(() => {})
    .catch(err => {
        logger.error('Failed to start the server CORE. \n', err);
    });


