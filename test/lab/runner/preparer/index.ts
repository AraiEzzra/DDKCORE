import { NODE_NAME } from 'test/lab/config';
import { FIRST_PEER_NAME, SECOND_PEER_NAME, TEST_RUNNER_NAME } from 'test/lab/utils/constants';
import { NetworkSynchronizer, NodesNetworkSynchronizer } from 'test/lab/runner/sync';

export interface TestPreparer {

    prepare(): Promise<void>;

    prepareTestRunnerNode(testName: string): Promise<void>;

    preparePeerNode(testName: string): Promise<void>;

}

export class NodesTestPreparer implements TestPreparer {

    networkSynchronizer: NetworkSynchronizer;

    testRunnerMethod: Function;
    firstPeerMethod: Function;
    secondPeeMethod: Function;

    private testName: string;

    constructor(testName: string,
                testRunnerMethod: Function = null,
                firstPeerMethod: Function = null,
                secondPeeMethod: Function = null
    ) {
        this.networkSynchronizer = new NodesNetworkSynchronizer(testName);
        this.testRunnerMethod = testRunnerMethod;
        this.firstPeerMethod = firstPeerMethod;
        this.secondPeeMethod = secondPeeMethod;
        this.testName = testName;
    }

    async prepare(): Promise<void> {
        NODE_NAME === TEST_RUNNER_NAME
            ? await this.prepareTestRunnerNode()
            : await this.preparePeerNode();
    }

    async prepareTestRunnerNode(): Promise<void> {
        if (this.testRunnerMethod) {
            await this.testRunnerMethod();
        }
        await this.networkSynchronizer.syncTestRunnerNode();
    }

    async preparePeerNode(): Promise<void> {
        console.log(`Executing method for test: ${this.testName}, node: ${NODE_NAME}`);

        if (this.firstPeerMethod && NODE_NAME === FIRST_PEER_NAME) {
            await this.firstPeerMethod();
        }

        if (this.secondPeeMethod && NODE_NAME === SECOND_PEER_NAME) {
            await this.secondPeeMethod();
        }
        await this.networkSynchronizer.syncPeerNode();
    }
}
