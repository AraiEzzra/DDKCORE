import fs from 'fs';
import readline from 'readline';

import { ResponseEntity } from 'shared/model/response';

export class StateLoader {
    async load<T>(
        path: string,
        deserialize: (row: any) => T,
    ): Promise<ResponseEntity<Array<T>>> {
        try {
            const stream = fs.createReadStream(path);
            const reader = readline.createInterface(stream);
            const data: Array<T> = [];

            return new Promise((resolve) => {
                reader.on('line', (row) => {
                    data.push(deserialize(row));
                }).on('close', () => {
                    resolve(new ResponseEntity({ data }));
                });
            });
        } catch (error) {
            return new ResponseEntity({ errors: [error] });
        }
    }
}
