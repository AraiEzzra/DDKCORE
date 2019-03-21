import * as crypto from 'crypto';

import { ed, IKeyPair } from 'shared/util/ed';

export const createKeyPairBySecret = (secret: string): IKeyPair => {
    const hash = crypto.createHash('sha256').update(secret, 'utf8').digest();

    return ed.makeKeyPair(hash);
};
