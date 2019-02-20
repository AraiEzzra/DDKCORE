import os from 'os';
import crypto from 'crypto';
import db from 'shared/driver/db';
import queries from 'core/repository/queries/block';
import config from 'shared/util/config';

export class Headers {
    os: string;
    version: string;
    port: number;
    height: 1;
    nethash: string;
    broadhash: string;
    minVersion: string;
    nonce: string;
    ip: string;

    constructor() {
        this.os = os.platform() + os.release();
        this.port = 8080;
        this.ip = '0.0.0.0';
        this.broadhash = null;
    }

    update(data) {
        this.broadhash = data.broadhash || this.broadhash;
        this.height = data.height || this.height;
        this.minVersion = data.minVersion || this.minVersion;
        this.nonce = data.nonce || this.nonce;
    }

    async getBroadhash() {
        const rows = await db.manyOrNone(queries.loadLastNBlocks,
            { blockLimit: 5 });
        if (rows.length <= 1) {
            return this.broadhash;
        }
        const seed = rows.map(row => row.id).join('');
        const hash = crypto.createHash('sha256').update(seed, 'utf8').digest();
        return hash.toString('hex');
    };
}

export default new Headers();
