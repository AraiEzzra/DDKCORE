import express from 'express';
import * as bodyParser from 'body-parser';
import { setApp } from './util/decorator';
import './controller';

// import 'shared/driver/redis';
// import 'shared/driver/elasticsearch';
// import 'shared/driver/db';

class App {
    public app: express.Application;
    public router: express.Router;

    constructor() {
        if (!this.app) {
            this.init();
        }
    }

    private init() {
        this.app = express();
        this.app.use(bodyParser.json());
        setApp(this.app);
    }
}

export const app = new App().app;
