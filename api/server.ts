import { Application } from 'express';
import * as bodyParser from 'body-parser';
import { logger } from 'shared/util/logger';
import { Loader } from './loader';

const env = process.env;

const preconfiguration: Array<Promise<any>> = [];

const DEFAULT_PORT = 3001;
const port = env.SERVER_CORE ? env.SERVER_CORE : DEFAULT_PORT;

const app: Application = require('express')();
app.use(bodyParser.json());

const loader = new Loader();
preconfiguration.push(loader.initRoute(app));

Promise.all(preconfiguration)
    .then(() => {
        app.listen(port, () => {
            logger.info('API Server is ready');
        });
    })
    .catch(err => {
        logger.error('Failed to start the server API. \n', err);
    });
