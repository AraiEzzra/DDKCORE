import { NetworkSynchronizer, NodesNetworkSynchronizer } from 'test/lab/runner/sync';
import { NodesTestPreparer, TestPreparer } from 'test/lab/runner/preparer';

export class TestRunner {

    private _preparer: TestPreparer;
    private _synchronizer: NetworkSynchronizer;

    constructor(testName: string,
                firstPeerMethod: Function = null,
                secondPeeMethod: Function = null,
                testRunnerMethod: Function = null,
    ) {
        this._preparer = new NodesTestPreparer(testName, firstPeerMethod, secondPeeMethod, testRunnerMethod);
        this._synchronizer = new NodesNetworkSynchronizer(testName);
    }

    get preparer(): TestPreparer {
        return this._preparer;
    }

    get synchronizer(): NetworkSynchronizer {
        return this._synchronizer;
    }
}
