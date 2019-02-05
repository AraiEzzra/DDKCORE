import { Application } from 'express';
import * as bodyParser from 'body-parser';
import { setRoute } from './util/decorator';
import './controller';

const env = process.env;

const app: Application = require('express')();
setRoute(app);
app.use(bodyParser.json());

const DEFAULT_PORT = 3000;
const port = env.SERVER_CORE ? env.SERVER_CORE : DEFAULT_PORT;

app.listen(port, () => {
    console.log(`Core. Listening on port ${port}`);
});
