import { Application } from 'express';
import * as bodyParser from 'body-parser';

const env = process.env;
const app: Application = require('express')();
app.use(bodyParser.json());

const defaultPort = 4000;
const port = env.SERVER_MOCK_TEST ? env.SERVER_MOCK_TEST : defaultPort;

app.listen(port, () => {
    console.log(`Test server. Listening on port ${port}`);
});


export const server = app;
