import fs from 'fs';
import util from 'util';

import { ResponseEntity } from 'shared/model/response';
import { logger } from 'shared/util/logger';

export class StateSaver {
    private readonly writeFile = util.promisify(fs.writeFile);
    private readonly appendFile = util.promisify(fs.appendFile);

    async save<T>(path: string, data: Array<T>, serialize: (data: T) => any): Promise<ResponseEntity<void>> {
        try {
            logger.debug(`[StateSaver][save] ${path}`);
            await this.writeFile(path, '');
            for (const el of data) {
                await this.appendFile(path, `${serialize(el)}\n`);
            }
            return new ResponseEntity();
        } catch (error) {
            return new ResponseEntity({ errors: [error] });
        }
    }
}
