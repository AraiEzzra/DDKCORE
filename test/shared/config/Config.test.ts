import { expect } from 'chai';
import Config from 'shared/util/config';

const env = process.env;
const config: any = Config.config;
const genesisBlock: any = Config.genesisBlock;
const constants: any = Config.constants;

describe('Config ', () => {
    it('Process env', () => {
        expect(!!env.FORGE_SECRET).equal(true);
    });

    it('config.db.host should be the same as env.DB_HOST', () => {
        expect(config.db.host).equal(env.DB_HOST || '0.0.0.0');
    });

    it('genesisBlock is included', () => {
        expect(genesisBlock.transactions).to.be.an('array');
    });

    it('constants.NODE_ENV_IN should be the same as env.NODE_ENV_IN and not null', () => {
        expect(constants.NODE_ENV_IN).equal(env.NODE_ENV_IN);
        expect(!!constants.NODE_ENV_IN).equal(true);
    });
});
