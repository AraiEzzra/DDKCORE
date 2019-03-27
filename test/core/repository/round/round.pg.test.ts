import db from 'shared/driver/db/index';
import { Round } from 'shared/model/round';
import RoundPGRepo from 'core/repository/round/pg';
import { expect } from 'chai';
import {
    getNewRound, createRoundTable, dropRoundTable
} from 'test/core/repository/round/mock';

const insertRound = async () => {
    let round = getNewRound();
    await db.query(`INSERT INTO round(height_start, slots)
        VALUES ($1, $2);`, [round.startHeight, round.slots]);
    return round;
};

describe('Round repository', () => {

    describe('getByHeight', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await RoundPGRepo.getByHeight(0);
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await createRoundTable();
            });

            it('should return response with null', async () => {
                const response = await RoundPGRepo.getByHeight(0);
                expect(response).to.be.undefined;
            });

            after(async () => {
                await dropRoundTable();
            });
        });

        context('if round exists', () => {

            let round;

            before(async () => {
                await createRoundTable();
                round = await insertRound();
            });

            it('should return response with round', async () => {
                const response = await RoundPGRepo.getByHeight(round.startHeight);
                expect(response).to.be.an.instanceOf(Round);
                expect(response.slots).to.be.eql(round.slots);
            });

            after(async () => {
                await dropRoundTable();
            });
        });
    });

    describe('getMany', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await RoundPGRepo.getMany(2,0);
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await createRoundTable();
            });

            it('should return empty array', async () => {
                const response = await RoundPGRepo.getMany(10, 0);
                expect(response).to.be.lengthOf(0);
            });

            after(async () => {
                await dropRoundTable();
            });
        });

        context('if rounds exist', () => {

            let rounds = [];

            before(async () => {
                await createRoundTable();
                for (let i = 0; i < 15; i++) {
                    rounds.push(await insertRound());
                }
            });

            it('should return response with round', async () => {
                let response = await RoundPGRepo.getMany(20, 0);
                expect(response).to.be.lengthOf(15);
                response = await RoundPGRepo.getMany(10, 3);
                expect(response).to.be.lengthOf(10);
                expect(response[0]).to.be.eql(rounds[3]);
                expect(response[9]).to.be.eql(rounds[12]);
            });

            after(async () => {
                await dropRoundTable();
            });
        });
    });

    describe('delete', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await RoundPGRepo.delete(getNewRound());
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if round exists', () => {

            let round;

            before(async () => {
                await createRoundTable();
                round = await insertRound();
            });

            it('should delete round from repo', async () => {
                await RoundPGRepo.delete(round);
                const response = await RoundPGRepo.getMany(10, 0);
                expect(response).to.be.lengthOf(0);
            });

            after(async () => {
                await dropRoundTable();
            });
        });
    });

    describe('saveOrUpdate', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await RoundPGRepo.saveOrUpdate(null);
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table exists', () => {

            let rounds = [];
            const count = 100;
            before(async () => {
                await createRoundTable();
                for (let i = 0; i < count; i++) {
                    rounds.push(getNewRound());
                }
            });

            it('should save round', async () => {
                await RoundPGRepo.saveOrUpdate(rounds[0]);
                const response = await RoundPGRepo.getMany(1000, 0);
                expect(response).to.be.lengthOf(1);
            });

            it('should save rounds', async () => {
                await RoundPGRepo.saveOrUpdate(rounds);
                const response = await RoundPGRepo.getMany(1000, 0);
                expect(response).to.be.lengthOf(100);
            });

            after(async () => {
                await dropRoundTable();
            });
        });
    });
});
