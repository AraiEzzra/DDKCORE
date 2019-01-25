import express from 'express';
import * as bodyParser from 'body-parser';
import 'shared/driver/redis';
import 'shared/driver/elasticsearch';
import 'shared/driver/db';

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
        this.configurate();
    }

    private configurate() {
        this.app.use(bodyParser.json());
    }
}

export const app = new App().app;
