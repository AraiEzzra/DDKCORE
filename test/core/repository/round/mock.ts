import { Round } from 'shared/model/round';
import RoundService from 'core/service/round';
import db from 'shared/driver/db';
import * as crypto from 'crypto';

let roundSequence = 1;
export const getNewRoundWithHash = () => {
    let hash = [];
    for (let i = 0; i < 3; i++) {
        hash.push({
            generatorPublicKey: crypto.createHash('md5').update((roundSequence + i).toString()).digest('hex')
        });
    }
    let slots = RoundService.generatorPublicKeyToSlot(hash, Date.now());
    let round = new Round({
        startHeight: roundSequence,
        endHeight: roundSequence + 2,
        slots
    });
    roundSequence += 3;
    return { round, hash };
};

export const getNewRound = () => {
    return getNewRoundWithHash().round;
};

export const createRoundTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS "round" (
            "height_start"  INTEGER PRIMARY KEY,
            "height_finish" INTEGER,
            "slots"         JSON    NOT NULL DEFAULT '{}' :: JSON
        );
    `);
};

export const dropRoundTable = async () => {
    await db.query('DROP TABLE round;');
};
