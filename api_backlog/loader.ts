import { Application } from 'express';
import { setRoute } from './util/http_decorator';
import './controller';

export class Loader {

    async initRoute(app: Application): Promise<boolean> {
        setRoute(app);
        return true;
    }
}

