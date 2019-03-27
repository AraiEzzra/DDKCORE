import { expect } from 'chai';
import config from 'shared/config';

const env = process.env;

describe('Config ', () => {
    it('Process env', () => {
        expect(!!env.FORGE_SECRET).equal(true);
    });

    it('config.db.host should be the same as env.DB_HOST', () => {
        expect(config.DB.HOST).equal(env.DB_HOST || '0.0.0.0');
    });

    it('genesisBlock is included', () => {
        expect(config.GENESIS_BLOCK.transactions).to.be.an('array');
    });

    it('constants.NODE_ENV_IN should be the same as env.NODE_ENV_IN and not null', () => {
        expect(config.NODE_ENV_IN).equal(env.NODE_ENV_IN);
        expect(!!config.NODE_ENV_IN).equal(true);
    });
});
