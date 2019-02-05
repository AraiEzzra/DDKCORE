import { Application } from 'express';
import * as bodyParser from 'body-parser';
import { db } from 'shared/driver';
import { Loader } from './loader';

const env = process.env;
const preconfiguration: Array<Promise<any>> = [];

const DEFAULT_PORT = 3000;
const port = env.SERVER_CORE ? env.SERVER_CORE : DEFAULT_PORT;
const app: Application = require('express')();

app.use(bodyParser.json());

const loader = new Loader();

preconfiguration.push(loader.runMigrate(db));
preconfiguration.push(loader.initRoute(app));


Promise.all(preconfiguration)
    .then(res => {
        app.listen(port, () => {
            /**TODO need to add logger about Start Server */
        });
    })
    .catch(err => {
        /**TODO need to add logger about Error */
    });


