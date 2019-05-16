import { expect } from 'chai';
import Loader from 'core/loader';
import SyncService from 'core/service/sync';

before(async () => {
    await Loader.start();
    SyncService.setConsensus(true);
});
