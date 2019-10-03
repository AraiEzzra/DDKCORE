import { expect } from 'chai';
import fs from 'fs';
import util from 'util';

import { StateSaver } from 'shared/util/state/saver';
import { StateLoader } from 'shared/util/state/loader';

const unlink = util.promisify(fs.unlink);

describe('State saver', () => {
    it('save / load', async () => {
        const saver = new StateSaver();
        const data = [
            { name: 'test1' },
            { name: 'test2' },
            { name: 'test3' },
        ];
        const path = './test-file';
        const saveResponse = await saver.save(path, data, JSON.stringify);

        expect(saveResponse.success).to.equal(true);

        const loader = new StateLoader();
        const loadResponse = await loader.load(path, JSON.parse);

        expect(loadResponse.success).to.equal(true);
        expect(data).to.deep.equal(loadResponse.data);

        await unlink(path);
    });
});
