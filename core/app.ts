import express from 'express';
import * as bodyParser from 'body-parser';
import { redisGetAsync } from 'shared/driver/redis';

class App {
    public app: express.Application;

    constructor() {
        if (!this.app) {
            this.init();
        }
    }

    private init() {
        this.app = express();

        this.configurate();
        this.route();

    }

    private configurate() {
        this.app.use(bodyParser.json());
    }

    private route() {
        // this.app.use('/peer/');
    }

    private async driver() {
        /**
         *  connect (PGP, redis, ES)
         */
    }
}

export const app = new App().app;
