import { Application } from 'express';
import * as bodyParser from 'body-parser';
import { setRoute } from './util/decorator';
import './controller';

const env = process.env;

const app: Application = require('express')();
app.use(bodyParser.json());
setRoute(app);

const defaultPort = 3000;
const port = env.SERVER_CORE ? env.SERVER_CORE : defaultPort;

app.listen(port, () => {
    console.log(`Core. Listening on port ${port}`);
});
