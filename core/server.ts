import { Application } from 'express';
import * as bodyParser from 'body-parser';
import { db } from 'shared/driver';
import { Loader } from './loader';
const env = process.env;

const app: Application = require('express')();
app.use(bodyParser.json());

const loader = new Loader();
loader.initRoute(app);
loader.runMigrate(db)
    .then(res => {
        /**
         * TODO Change on logger
         */
        console.log('*** Migrate Done ****');
    });

const DEFAULT_PORT = 3000;
const port = env.SERVER_CORE ? env.SERVER_CORE : DEFAULT_PORT;

app.listen(port, () => {
    console.log(`Core. Listening on port ${port}`);
});
